'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('call_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            caller_number: {
                type: Sequelize.STRING
            },
            agent_extension: {
                type: Sequelize.STRING
            },
            call_duration: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            status: {
                type: Sequelize.ENUM('ANSWERED', 'MISSED', 'BUSY', 'IVR_ONLY', 'IVR_COMPLAINT'),
                defaultValue: 'IVR_ONLY'
            },
            recording_path: {
                type: Sequelize.TEXT
            },
            recording_duration: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.createTable('tickets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            freshdesk_ticket_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            call_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'call_logs',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            issue_type: {
                type: Sequelize.STRING
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tickets');
        await queryInterface.dropTable('call_logs');
    }
};
