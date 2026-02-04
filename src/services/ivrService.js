const fs = require("fs");
const path = require("path");
const axios = require("axios");
const db = require("../db");
const freshdesk = require("../freshdesk");
const { ARI_CONFIG, APP_NAME, MENUS } = require("../config/ivrConfig");
const { playSound } = require("../utils/ariUtils");

// Store session data (like selected ticket type) for active calls
// Key: Channel ID, Value: Object { dept, ticketType }
const activeSessions = new Map();

/**
 * Main handler for new calls
 */
async function handleStasisStart(ari, event, channel) {
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
}

/**
 * Handler for call ending
 */
async function handleStasisEnd(event, channel) {
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
}

/**
 * Core Logic: Enter a menu
 */
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

/**
 * Recording Logic
 */
async function handleRecording(ari, channel) {
    // 1. Play instructions
    await playSound(ari, channel, "custom/valoro/valoro-record-instructions");

    const fileName = `tech-${channel.id}-${Date.now()}`;
    console.log(`🎙️ Starting recording: ${fileName}`);

    // 2. Start Recording
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

/**
 * Ticket Creation Logic
 */
async function handleCreateTicket(ari, channel, recordingFilename) {
    const session = activeSessions.get(channel.id);
    if (!session) return;

    const { dept, ticketType } = session;
    const callerNumber = channel.caller?.number || "Unknown";

    console.log(`Processing Ticket | Dept: ${dept} | File: ${recordingFilename}`);

    // 1. Setup Local Path
    // Note: We need to go up one level from src/services to src, or just use __dirname carefully.
    // Using path.join(__dirname, '..', 'temp_recordings') effectively puts it in src/temp_recordings
    const tempDir = path.join(__dirname, "..", "temp_recordings");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const localFilePath = path.join(tempDir, `${recordingFilename}.wav`);

    try {
        console.log(`⬇️ Downloading recording from Asterisk...`);

        // 2. Download using Axios (Better for Streams)
        const downloadUrl = `${ARI_CONFIG.url}/ari/recordings/stored/${recordingFilename}/file`;

        const response = await axios({
            method: "get",
            url: downloadUrl,
            responseType: "stream",
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
    } catch (e) { }
}

/**
 * Operator Transfer Logic
 */
async function handleOperator(ari, callerChannel) {
    const session = activeSessions.get(callerChannel.id);
    console.log("Transferring to Operator...");
    await playSound(ari, callerChannel, "custom/valoro/valoro-operator");

    // 1. Create Bridge
    const bridge = ari.Bridge();
    await bridge.create({ type: "mixing" });

    // 2. Play Hold Music
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
        // --> DB: Log success with Agent info
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
        } catch (e) { }
        try {
            await callerChannel.hangup();
        } catch (e) { }
        try {
            await operatorChannel.hangup();
        } catch (e) { }
    };
    callerChannel.on("StasisEnd", cleanup);
    operatorChannel.on("StasisEnd", cleanup);
}

module.exports = {
    handleStasisStart,
    handleStasisEnd,
};
