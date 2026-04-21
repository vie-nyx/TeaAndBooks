const express = require("express");
const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.get("/:userId", auth, profileController.getUserProfile);
router.put("/:userId", auth, profileController.updateUserById);
router.post("/:userId/follow", auth, profileController.toggleFollow);
router.get("/:userId/followers", auth, profileController.getFollowers);
router.get("/:userId/following", auth, profileController.getFollowing);

module.exports = router;
