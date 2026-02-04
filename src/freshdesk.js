const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN; // e.g., 'yourcompany.freshdesk.com'
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

const freshdesk = {
  async createTicketWithRecording(
    dept,
    ticketType,
    recordingPath,
    callerNumber
  ) {
    if (!FRESHDESK_DOMAIN || !FRESHDESK_API_KEY) {
      console.error("Freshdesk credentials missing.");
      return "ERROR_NO_CREDENTIALS";
    }

    let email = "";
    switch (ticketType) {
      case "system_issue":
      case "account_issue":
        email = "ahmedboody@gmail.com";
        break;
      case "bug_report":
      case "integration_issue":
        email = "saleh@gmail.com";
        break;
      default:
        email = "ahmedboody@gmail.com";
        break;
    }

    try {
      const data = new FormData();
      data.append("email", email); // Required field, dummy for phone
      data.append("subject", `Voice Complaint from ${callerNumber}`);
      data.append(
        "description",
        `User ${callerNumber} left a voice complaint. about ${ticketType} in the ${dept} department`
      );
      data.append("status", 2); // 2 = Open
      data.append("priority", 2); // 2 = Medium

      if (recordingPath && fs.existsSync(recordingPath)) {
        data.append("attachments[]", fs.createReadStream(recordingPath));
      } else {
        console.warn(
          `Recording file not found or path invalid: ${recordingPath}`
        );
      }

      const auth = Buffer.from(`${FRESHDESK_API_KEY}:X`).toString("base64");

      const response = await axios.post(
        `https://${FRESHDESK_DOMAIN}/api/v2/tickets`,
        data,
        {
          headers: {
            ...data.getHeaders(),
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.id; // Return Ticket ID
    } catch (error) {
      console.error(
        "Error creating Freshdesk ticket:",
        error.response ? error.response.data : error.message
      );
      return null;
    }
  },
};

module.exports = freshdesk;
