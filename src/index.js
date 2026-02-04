const client = require("ari-client");
const express = require("express");
const db = require("./db");
const { CallLog, Ticket, sequelize } = db;
const { Op } = require("sequelize");
const freshdesk = require("./freshdesk");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());

// const ARI_USER = 'freshdesk'; // Updated to match ari.conf
// const ARI_PASS = 'ahmed';     // Updated to match ari.conf
// const APP_NAME = 'freshdesk-ivr'; // Updated to match extensions.conf

// --- Express API ---
app.use(express.json());

app.get("/api/stats", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const totalCalls = await CallLog.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay,
        },
      },
    });

    const missedCalls = await CallLog.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay,
        },
        status: "MISSED",
      },
    });

    res.json({
      date: today.toISOString().split("T")[0],
      total_calls: totalCalls,
      missed_calls: missedCalls,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/recordings/:filename", async (req, res) => {
  // 1. Clean the filename (ARI expects name WITHOUT extension)
  // We strip the extension just in case the user requested "file.wav"
  const recordingName = req.params.filename;
  // const recordingName = path.parse(rawFilename).name;

  try {
    console.log(`📥 Streaming recording '${recordingName}' from Asterisk...`);

    // 2. Build the ARI URL manually
    const downloadUrl = `${ARI_CONFIG.url}/ari/recordings/stored/${recordingName}/file`;

    // 3. Request the stream using Axios
    const response = await axios({
      method: "get",
      url: downloadUrl,
      responseType: "stream", // <--- Critical: Gets the raw audio stream
      auth: {
        username: ARI_CONFIG.user,
        password: ARI_CONFIG.pass,
      },
    });

    // 4. Set Headers so the browser knows it's an audio file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${recordingName}.wav"`
    );
    res.setHeader("Content-Type", "audio/wav");

    // 5. Pipe the Axios stream directly to the User response
    response.data.pipe(res);

    // Optional: Log when download finishes
    response.data.on("end", () => {
      console.log("✅ Recording sent successfully.");
    });
  } catch (err) {
    console.error(
      `❌ Error retrieving recording '${recordingName}':`,
      err.message
    );

    // Handle "File Not Found" specifically
    if (err.response && err.response.status === 404) {
      return res.status(404).send("Recording not found on Asterisk server.");
    }

    res.status(500).send("Failed to retrieve recording.");
  }
});

app.get("/api/logs/:logId", async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await CallLog.findByPk(logId, {
      include: [
        {
          model: Ticket,
          as: "ticket",
        },
      ],
    });
    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- DASHBOARD APIs ---

// Stats with date range
app.get("/api/stats/range", async (req, res) => {
  try {
    const { start, end } = req.query;

    // Default to last 7 days if no dates provided
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = start ? new Date(start) : new Date(endDate);
    if (!start) startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const whereClause = {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
    };

    const totalCalls = await CallLog.count({ where: whereClause });
    const missedCalls = await CallLog.count({
      where: { ...whereClause, status: "MISSED" },
    });
    const answeredCalls = await CallLog.count({
      where: { ...whereClause, status: "ANSWERED" },
    });
    const ivrComplaints = await CallLog.count({
      where: { ...whereClause, status: "IVR_COMPLAINT" },
    });

    // Group by status
    const byStatus = await CallLog.findAll({
      where: whereClause,
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Average durations
    const avgDurations = await CallLog.findOne({
      where: whereClause,
      attributes: [
        [
          sequelize.fn("AVG", sequelize.col("call_duration")),
          "avgCallDuration",
        ],
        [
          sequelize.fn("AVG", sequelize.col("recording_duration")),
          "avgRecordingDuration",
        ],
      ],
      raw: true,
    });

    res.json({
      range: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      total_calls: totalCalls,
      missed_calls: missedCalls,
      answered_calls: answeredCalls,
      ivr_complaints: ivrComplaints,
      by_status: byStatus,
      avg_call_duration: Math.round(avgDurations?.avgCallDuration || 0),
      avg_recording_duration: Math.round(
        avgDurations?.avgRecordingDuration || 0
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Enhanced logs with filters
app.get("/api/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const { status, date, caller } = req.query;

    const whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by date
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      whereClause.createdAt = {
        [Op.gte]: filterDate,
        [Op.lt]: nextDay,
      };
    }

    // Filter by caller number (partial match)
    if (caller) {
      whereClause.callerNumber = {
        [Op.iLike]: `%${caller}%`,
      };
    }

    const logs = await CallLog.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: Ticket, as: "ticket" }],
    });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Logs count for pagination
app.get("/api/logs/count", async (req, res) => {
  try {
    const { status, date, caller } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      whereClause.createdAt = { [Op.gte]: filterDate, [Op.lt]: nextDay };
    }
    if (caller) {
      whereClause.callerNumber = { [Op.iLike]: `%${caller}%` };
    }

    const count = await CallLog.count({ where: whereClause });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Single call log by ID
app.get("/api/logs/:id", async (req, res) => {
  try {
    const log = await CallLog.findByPk(req.params.id, {
      include: [{ model: Ticket, as: "ticket" }],
    });
    if (!log) {
      return res.status(404).json({ error: "Call log not found" });
    }
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List tickets with filters
app.get("/api/tickets", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const { issueType } = req.query;

    const whereClause = {};
    if (issueType) {
      whereClause.issueType = issueType;
    }

    const tickets = await Ticket.findAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: CallLog, as: "callLog" }],
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Single ticket by ID
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{ model: CallLog, as: "callLog" }],
    });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});

// --- ARI Application ---

// const { v4: uuidv4 } = require('uuid'); // Install with: npm install uuid

// --- CONFIGURATION ---
const ARI_CONFIG = {
  url: process.env.ARI_URL || "http://localhost:8088",
  user: process.env.ARI_USER || "freshdesk",
  pass: process.env.ARI_PASS || "ahmed",
};
const APP_NAME = "valoro-tech-ivr";

// --- MENU DEFINITIONS ---
// This replaces your [ivr-valoro] and [ivr-support] blocks
const MENUS = {
  main: {
    sound: "custom/valoro/valoro-main-menu",
    options: {
      1: { action: "menu", target: "support" },
      0: { action: "operator" },
    },
  },
  support: {
    sound: "custom/valoro/valoro-support-menu",
    options: {
      1: { action: "record", type: "system_issue" },
      2: { action: "record", type: "account_issue" },
      3: { action: "record", type: "bug_report" },
      4: { action: "record", type: "integration_issue" },
      0: { action: "operator" },
    },
  },
};

// Store session data (like selected ticket type) for active calls
// Key: Channel ID, Value: Object { dept, ticketType }
const activeSessions = new Map();

client
  .connect(ARI_CONFIG.url, ARI_CONFIG.user, ARI_CONFIG.pass)
  .then((ari) => {
    console.log(`Connected. Waiting for Stasis app: ${APP_NAME}`);
    ari.start(APP_NAME);

    // --- 1. CALL START ---
    ari.on("StasisStart", async (event, channel) => {
      if (event.args[0] === "dialed-operator") {
        console.log(`Ignoring StasisStart for Operator channel: ${channel.id}`);
        return;
      }
      console.log("New Call from: ", event.channel.caller?.number);
      try {
        const callerNum = event.channel.caller?.number || "Unknown";
        console.log(`New Call from: ${callerNum}`);

        // --> DB: Log the new call immediately
        const callId = await db.logCall(callerNum);

        // Initialize Session
        activeSessions.set(channel.id, {
          dept: "general",
          ticketType: "unknown",
          callId,
          startTime: Date.now(),
        });

        await channel.answer();

        // [ivr-valoro] Setup logic
        await playSound(ari, channel, "custom/valoro/valoro-welcome");

        // Enter Main Menu
        await enterMenu(ari, channel, "main");
      } catch (err) {
        console.error("Error in StasisStart:", err);
      }
    });

    // Cleanup when call ends
    ari.on("StasisEnd", async (event, channel) => {
      try {
        const session = activeSessions.get(channel.id);
        if (session) {
          const duration = Math.floor((Date.now() - session.startTime) / 1000);

          // --> DB: Final update (if not already updated by other logic)
          console.log("call duration", duration);
          await db.updateCallStatus({
            id: session.callId,
            callDuration: duration,
          });
          activeSessions.delete(channel.id);
          console.log(`Call ended: ${channel.id}`);
        }
      } catch (err) {
        console.error("Error in StasisEnd:", err);
      }
    });
  })
  .catch((err) => console.error(err));

// --- CORE LOGIC FUNCTIONS ---

async function enterMenu(ari, channel, menuName) {
  console.log("hello from menu");
  const menu = MENUS[menuName];
  if (!menu) return;

  console.log(`Channel ${channel.id} entering menu: ${menuName}`);

  // Play the menu options
  await playSound(ari, channel, menu.sound);

  // Setup DTMF Listener (Waiting for keypress)
  const dtmfHandler = async (event) => {
    const digit = event.digit;
    const choice = menu.options[digit];

    if (choice) {
      // Valid Input - Stop listening for this specific menu
      channel.removeListener("ChannelDtmfReceived", dtmfHandler);

      if (choice.action === "menu") {
        // Navigate to next menu (e.g., Main -> Support)
        await enterMenu(ari, channel, choice.target);
      } else if (choice.action === "operator") {
        // Transfer to Operator
        await handleOperator(ari, channel);
      } else if (choice.action === "record") {
        // Update Session with selection
        const session = activeSessions.get(channel.id);
        if (session) {
          session.dept = "support";
          session.ticketType = choice.type; // e.g., 'system_issue'
          // --> DB: Update status to show they entered recording flow
          await db.updateCallStatus({
            id: session.callId,
            status: "IVR_COMPLAINT",
            agentExtension: null,
            callDuration: 0,
            recordingPath: null,
            recordingDuration: null,
          });
        }
        // Go to Recording Logic
        await handleRecording(ari, channel);
      }
    } else {
      // Invalid Input ([ivr-valoro] 'i' extension)
      await playSound(ari, channel, "custom/valoro/valoro-invalid");
      await playSound(ari, channel, menu.sound); // Replay menu
    }
  };

  channel.on("ChannelDtmfReceived", dtmfHandler);
}

// --- RECORDING LOGIC (Replaces [ivr-tech-record]) ---
async function handleRecording(ari, channel) {
  // 1. Play instructions
  await playSound(ari, channel, "custom/valoro/valoro-record-instructions");

  const fileName = `tech-${channel.id}-${Date.now()}`;
  console.log(`🎙️ Starting recording: ${fileName}`);

  // 2. Start Recording
  // IMPORTANT: channel.record() returns the LiveRecording object.
  // We await it to ensure the command was sent successfully.
  try {
    const liveRecording = await channel.record({
      name: fileName,
      format: "wav",
      maxDurationSeconds: 120,
      terminateOn: "#", // Stop when user presses #
      beep: true,
      ifExists: "overwrite",
    });

    // 3. Listen for the finish event
    // We use a specific listener for THIS recording to be safe
    const onRecordingFinished = async (event, recordingObj) => {
      try {
        // Filter: Ensure this event is for OUR file
        if (recordingObj.name !== fileName) return;

        // Cleanup listener
        ari.removeListener("RecordingFinished", onRecordingFinished);

        console.log(
          `✅ Recording finished: ${fileName} (${recordingObj.duration}s)`
        );

        // Update Database
        const session = activeSessions.get(channel.id);
        const recordingPath = fileName;
        console.log(`Recording duration: ${recordingObj.duration}`);
        if (session) {
          await db.updateCallStatus({
            id: session.callId,
            agentExtension: null,
            recordingPath: recordingPath,
            recordingDuration: Math.floor(recordingObj.duration),
          });
        }

        // Proceed to Ticket Creation
        await handleCreateTicket(ari, channel, fileName);
      } catch (err) {
        console.error("Error in RecordingFinished:", err);
      }
    };

    // Attach the listener to the generic client (ARI broadcasts events)
    ari.on("RecordingFinished", onRecordingFinished);
  } catch (err) {
    console.error(`❌ Failed to start recording: ${err.message}`);
    // If recording fails, maybe send them to operator?
    await playSound(ari, channel, "custom/valoro/valoro-error");
    await handleOperator(ari, channel);
  }
}

// --- TICKET CREATION (Replaces [ivr-create-ticket]) ---
async function handleCreateTicket(ari, channel, recordingFilename) {
  const session = activeSessions.get(channel.id);
  if (!session) return;

  const { dept, ticketType } = session;
  const callerNumber = channel.caller?.number || "Unknown";

  console.log(`Processing Ticket | Dept: ${dept} | File: ${recordingFilename}`);

  // 1. Setup Local Path
  const tempDir = path.join(__dirname, "temp_recordings");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const localFilePath = path.join(tempDir, `${recordingFilename}.wav`);

  try {
    console.log(`⬇️ Downloading recording from Asterisk...`);

    // 2. Download using Axios (Better for Streams)
    // Construct the full URL to the file endpoint
    const downloadUrl = `${ARI_CONFIG.url}/ari/recordings/stored/${recordingFilename}/file`;

    const response = await axios({
      method: "get",
      url: downloadUrl,
      responseType: "stream", // <--- Crucial: Tells axios to handle it as a file
      auth: {
        username: ARI_CONFIG.user,
        password: ARI_CONFIG.pass,
      },
    });

    // 3. Pipe the download to your local file
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`✅ Download saved: ${localFilePath}`);

    // 4. Upload to Freshdesk
    console.log(`⬆️ Uploading to Freshdesk...`);
    const ticketId = await freshdesk.createTicketWithRecording(
      dept,
      ticketType,
      localFilePath,
      callerNumber
    );

    if (ticketId) {
      await db.logTicket({
        callId: session.callId,
        freshdeskTicketId: ticketId.toString(),
        issueType: ticketType,
      });
      console.log(`🎫 Ticket created successfully: #${ticketId}`);
    } else {
      console.error(`❌ Failed to create Freshdesk ticket (No ID)`);
    }
  } catch (err) {
    console.error(`❌ Error in handleCreateTicket:`, err.message);
    if (err.response && err.response.status === 404) {
      console.error(
        "   (The recording file was not found on the Asterisk server)"
      );
    }
  } finally {
    // 5. Cleanup
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log(`🧹 Temp file cleaned up.`);
      } catch (e) {
        /* ignore */
      }
    }
  }

  // 6. Play Goodbye
  await playSound(ari, channel, "custom/valoro/valoro-ticket-created");
  await playSound(ari, channel, "custom/valoro/valoro-goodbye");

  try {
    await channel.hangup();
  } catch (e) {}
}

// --- OPERATOR LOGIC (Replaces [ivr-operator]) ---
async function handleOperator(ari, callerChannel) {
  const session = activeSessions.get(callerChannel.id);
  console.log("Transferring to Operator...");
  await playSound(ari, callerChannel, "custom/valoro/valoro-operator");

  // 1. Create Bridge
  const bridge = ari.Bridge();
  await bridge.create({ type: "mixing" });

  // 2. Play Hold Music
  // Note: Using 'moh' class "default"
  callerChannel.startMoh();

  // 3. Dial Operator
  const operatorChannel = ari.Channel();
  await operatorChannel.originate({
    endpoint: "PJSIP/operator",
    app: APP_NAME,
    appArgs: "dialed-operator",
  });

  // 4. When Operator Answers
  operatorChannel.on("StasisStart", async () => {
    console.log("Operator Answered.");
    callerChannel.stopMoh();
    await bridge.addChannel({
      channel: [callerChannel.id, operatorChannel.id],
    });
    // --> DB: Log success with Agent info (assuming operator is PJSIP/operator)
    if (session)
      await db.updateCallStatus({
        id: session.callId,
        status: "ANSWERED",
        agentExtension: "operator",
      });
  });

  // 5. Cleanup
  const cleanup = async () => {
    try {
      await bridge.destroy();
    } catch (e) {}
    try {
      await callerChannel.hangup();
    } catch (e) {}
    try {
      await operatorChannel.hangup();
    } catch (e) {}
  };
  callerChannel.on("StasisEnd", cleanup);
  operatorChannel.on("StasisEnd", cleanup);
}

// --- UTILS ---
/**
 * Plays a sound and waits for it to finish.
 * Uses the manual Playback resource creation pattern to ensure events work.
 */
function playSound(ari, channel, soundName) {
  return new Promise((resolve, reject) => {
    // 1. Create the Playback instance manually
    let playback = ari.Playback();

    // 2. Set up the listener BEFORE playing (to be safe)
    playback.on("PlaybackFinished", function (event, completedPlayback) {
      // Cleanup: remove listener to avoid memory leaks
      playback.removeAllListeners("PlaybackFinished");
      resolve();
    });
    console.log(`Playing sound: ${soundName}`);
    // 3. Play the sound using that specific playback instance
    channel.play(
      { media: `sound:${soundName}` },
      playback,
      function (err, newPlayback) {
        if (err) {
          console.error(`❌ Error playing '${soundName}':`, err.message);
          // We resolve anyway so the IVR doesn't get stuck hanging
          resolve();
        }
      }
    );
  });
}
