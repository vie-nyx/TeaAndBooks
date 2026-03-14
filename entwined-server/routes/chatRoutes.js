const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

const multer = require("multer");
const path = require("path");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/*
=================================
UNIFIED CLOUDINARY STORAGE
Handles:
- Chat images
- PDFs
- EPUB
=================================
*/

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    const ext = path.extname(file.originalname).toLowerCase();

    const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(ext);
    const isDocument = /\.(pdf|epub)$/i.test(ext);

    // IMAGE
    if (isImage) {
      return {
        folder: "entwined/chat/images",
        resource_type: "image"
      };
    }

    // DOCUMENT (PDF / EPUB)
    if (isDocument) {
      return {
        folder: "entwined/chat/files",
        resource_type: "raw"
      };
    }

    throw new Error("Unsupported file type");
  }
});

/*
=================================
UPLOAD MIDDLEWARE
=================================
*/

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

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
  upload
};