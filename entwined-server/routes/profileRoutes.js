const express = require("express");
const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.get("/suggestions", auth, profileController.getSuggestedUsers);
router.get("/:userId/content", auth, profileController.getUserContent);
router.get("/:userId/followers", auth, profileController.getFollowers);
router.get("/:userId/following", auth, profileController.getFollowing);
router.post("/:userId/follow", auth, profileController.toggleFollow);
router.get("/:userId", auth, profileController.getUserProfile);
router.put("/me/update", auth, profileController.updateMyProfile);

module.exports = router;
