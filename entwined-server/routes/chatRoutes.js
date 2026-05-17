const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const { uploadFile } = require("../middleware/upload");

/*
=================================
CONVERSATION ROUTES
=================================
*/

router.post("/conversation", auth, chatController.getOrCreateConversation);

router.post("/conversation/group", auth, chatController.createGroupChat);

router.get("/conversations", auth, chatController.getUserConversations);

router.post(
  "/conversation/:conversationId/members",
  auth,
  chatController.addGroupMembers
);

/*
=================================
MESSAGE ROUTES
=================================
*/

router.get("/unread-count", auth, chatController.getTotalUnreadCount);

router.post(
  "/conversation/:conversationId/read",
  auth,
  chatController.markConversationAsRead
);

router.get(
  "/conversation/:conversationId/messages",
  auth,
  chatController.getMessages
);

/*
=================================
EXPORT
=================================
*/

module.exports = {
  router,
  upload: uploadFile
};