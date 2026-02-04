const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.get("/stats", apiController.getStats);
router.get("/recordings/:filename", apiController.getRecording);
router.get("/logs/count", apiController.getLogsCount); // Specific routes before parameters
router.get("/logs/:logId", apiController.getLogById); // Original /api/logs/:logId
router.get("/logs_by_id/:id", apiController.getLogByIdParam); // Original /api/logs/:id - Note: Express might conflict if not careful.
// In original code:
// app.get("/api/logs/:logId", ...)
// app.get("/api/logs/:id", ...)
// These conflict. The first defined one wins.
// In the original file:
// 1. app.get("/api/logs/:logId", ...) (Lines 119-138)
// 2. app.get("/api/logs", ...) (Lines 222-266)
// 3. app.get("/api/logs/count", ...) (Lines 269-291)
// 4. app.get("/api/logs/:id", ...) (Lines 294-307)
// Route 1 and 4 are identical usage.
// I will just use one of them. "getLogByIdParam" seems more standard.
// But I will clean up the route definitions to be safe.

router.get("/stats/range", apiController.getStatsRange);

// Order matters:
router.get("/logs", apiController.getLogs); // /api/logs
// /api/logs/count is already defined above, which is safe.

// Now for the ID one. Since /logs is used for list, /logs/:id is fine.
// But wait, the original had two separate blocks for /:logId and /:id.
// It's likely dead code or accidental duplication. I will just map /logs/:id to getLogByIdParam which seems cleaner.
router.get("/logs/:id", apiController.getLogByIdParam);

router.get("/tickets", apiController.getTickets);
router.get("/tickets/:id", apiController.getTicketById);

module.exports = router;
