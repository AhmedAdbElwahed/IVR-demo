const { CallLog, Ticket, sequelize } = require("../db");
const { Op } = require("sequelize");
const axios = require("axios");
const { ARI_CONFIG } = require("../config/ivrConfig");

const getStats = async (req, res) => {
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
};

const getRecording = async (req, res) => {
    // 1. Clean the filename (ARI expects name WITHOUT extension)
    const recordingName = req.params.filename;

    try {
        console.log(`📥 Streaming recording '${recordingName}' from Asterisk...`);

        // 2. Build the ARI URL manually
        const downloadUrl = `${ARI_CONFIG.url}/ari/recordings/stored/${recordingName}/file`;

        // 3. Request the stream using Axios
        const response = await axios({
            method: "get",
            url: downloadUrl,
            responseType: "stream",
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
};

const getLogById = async (req, res) => {
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
};

const getStatsRange = async (req, res) => {
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
};

const getLogs = async (req, res) => {
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
};

const getLogsCount = async (req, res) => {
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
};

const getLogByIdParam = async (req, res) => {
    // This seems redundant with getLogById but was in the original file as /api/logs/:id
    // getLogById was /api/logs/:logId
    // I will map both to this logic or keep them separate if the logic differs slightly.
    // In original code:
    // /api/logs/:logId -> includes Ticket
    // /api/logs/:id -> includes Ticket, returns "Call log not found" vs "Log not found"
    // I'll reuse one logic for consistency or keep separate if needed.
    // Let's implement the :id one here as generic getCallLog
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
};

const getTickets = async (req, res) => {
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
};

const getTicketById = async (req, res) => {
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
};

module.exports = {
    getStats,
    getRecording,
    getLogById,
    getStatsRange,
    getLogs,
    getLogsCount,
    getLogByIdParam,
    getTickets,
    getTicketById,
};
