'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.belongsTo(models.CallLog, {
        foreignKey: 'callId',
        as: 'callLog'
      });
    }
  }
  Ticket.init({
    freshdeskTicketId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    callId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'call_logs',
        key: 'id'
      }
    },
    issueType: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets',
    timestamps: true,
    underscored: true
  });
  return Ticket;
};
