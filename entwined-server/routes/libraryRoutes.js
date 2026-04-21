const express = require("express");
const auth = require("../middleware/authMiddleware");
const libraryController = require("../controllers/libraryController");

const router = express.Router();

router.get("/me", auth, libraryController.getMyLibrary);
router.post("/book", auth, libraryController.addBook);
router.delete("/book/:shelf/:bookEntryId", auth, libraryController.removeBook);
router.patch("/move", auth, libraryController.moveBook);

module.exports = router;
