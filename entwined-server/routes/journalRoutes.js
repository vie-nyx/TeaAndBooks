const express = require("express");
const auth = require("../middleware/authMiddleware");
const journalController = require("../controllers/journalController");

const router = express.Router();

router.get("/:userId", auth, journalController.listJournalEntries);
router.post("/", auth, journalController.createJournalEntry);
router.put("/:entryId", auth, journalController.updateJournalEntry);
router.delete("/:entryId", auth, journalController.deleteJournalEntry);

module.exports = router;
