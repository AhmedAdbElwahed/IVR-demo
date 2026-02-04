const { CallLog, Ticket, sequelize } = require("./models");

const db = {
  sequelize, // Export sequelize instance for direct access if needed
  CallLog,
  Ticket,

  async logCall(callerNumber) {
    try {
      const call = await CallLog.create({
        callerNumber: callerNumber,
        status: "IVR_ONLY",
      });
      return call.id;
    } catch (error) {
      console.error("Error logging call:", error);
      return null;
    }
  },

  async updateCallStatus(
    payload = {
      id: null,
      status: null,
      agentExtension: null,
      callDuration: 0,
      recordingPath: null,
      recordingDuration: 0,
    }
  ) {
    // const {
    //   id,
    //   status,
    //   agentExtension,
    //   callDuration,
    //   recordingPath,
    //   recordingDuration,
    // } = payload;

    if (!payload.id) {
      throw new Error("CallLog id is required");
    }

    const updateData = {};

    // status validation
    if (payload.status !== undefined) {
      const allowedStatuses = [
        "ANSWERED",
        "MISSED",
        "BUSY",
        "IVR_ONLY",
        "IVR_COMPLAINT",
      ];
      if (!allowedStatuses.includes(payload.status)) {
        throw new Error("Invalid call status");
      }
      updateData.status = payload.status;
    }

    // agent extension validation
    if (payload.agentExtension !== undefined) {
      if (
        payload.agentExtension !== null &&
        typeof payload.agentExtension !== "string"
      ) {
        throw new Error("agentExtension must be a string or null");
      }
      updateData.agentExtension = payload.agentExtension;
    }

    // call duration validation
    if (payload.callDuration !== undefined) {
      if (!Number.isInteger(payload.callDuration) || payload.callDuration < 0) {
        throw new Error("callDuration must be a non-negative integer");
      }
      updateData.callDuration = payload.callDuration;
    }

    // recording path validation
    if (payload.recordingPath !== undefined) {
      if (
        payload.recordingPath !== null &&
        typeof payload.recordingPath !== "string"
      ) {
        throw new Error("recordingPath must be a string or null");
      }
      updateData.recordingPath = payload.recordingPath;
    }

    // recording duration validation
    if (payload.recordingDuration !== undefined) {
      console.log(payload.recordingDuration);
      if (payload.recordingDuration !== null) {
        if (
          !Number.isInteger(payload.recordingDuration) ||
          payload.recordingDuration < 0
        ) {
          throw new Error("recordingDuration must be a non-negative integer");
        }
      }

      updateData.recordingDuration = payload.recordingDuration;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    try {
      const [updatedRows] = await CallLog.update(updateData, {
        where: { id: payload.id },
      });

      if (updatedRows === 0) {
        throw new Error("CallLog not found or no changes applied");
      }
    } catch (error) {
      console.error("Error updating call status:", error);
      throw error;
    }
  },
  async logTicket({ freshdeskTicketId, callId, issueType }) {
    try {
      await Ticket.create({
        freshdeskTicketId: freshdeskTicketId,
        callId: callId,
        issueType: issueType,
      });
    } catch (error) {
      console.error("Error logging ticket:", error);
    }
  },
};

module.exports = db;
