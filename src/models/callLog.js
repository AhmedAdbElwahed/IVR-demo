"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CallLog extends Model {
    static associate(models) {
      CallLog.hasOne(models.Ticket, {
        foreignKey: "callId",
        as: "ticket",
        onDelete: "CASCADE",
      });
    }
  }
  CallLog.init(
    {
      callerNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "caller_number",
      },
      agentExtension: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "agent_extension",
      },
      callDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "call_duration",
      },
      status: {
        type: DataTypes.ENUM(
          "ANSWERED",
          "MISSED",
          "BUSY",
          "IVR_ONLY",
          "IVR_COMPLAINT"
        ),
        defaultValue: "IVR_ONLY",
      },
      recordingPath: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "recording_path",
      },
      recordingDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "recording_duration",
      },
    },
    {
      sequelize,
      modelName: "CallLog",
      tableName: "call_logs",
      timestamps: true,
      underscored: true,
    }
  );
  return CallLog;
};
