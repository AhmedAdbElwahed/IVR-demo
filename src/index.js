const client = require("ari-client");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import new modules
const { ARI_CONFIG, APP_NAME } = require("./config/ivrConfig");
const apiRoutes = require("./routes/apiRoutes");
const ivrService = require("./services/ivrService");

const app = express();
app.use(cors());

// --- Express API ---
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});

// --- ARI Application ---
client
  .connect(ARI_CONFIG.url, ARI_CONFIG.user, ARI_CONFIG.pass)
  .then((ari) => {
    console.log(`Connected. Waiting for Stasis app: ${APP_NAME}`);
    ari.start(APP_NAME);

    // --- 1. CALL START ---
    ari.on("StasisStart", (event, channel) => {
      ivrService.handleStasisStart(ari, event, channel);
    });

    // Cleanup when call ends
    ari.on("StasisEnd", (event, channel) => {
      ivrService.handleStasisEnd(event, channel);
    });
  })
  .catch((err) => console.error(err));

