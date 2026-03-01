const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/images";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for file uploads (PDF, EPUB)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/files";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Image upload middleware
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\//.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  }
});

// File upload middleware (PDF, EPUB)
const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for files
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /pdf|epub/;
    const allowedMimeTypes = /^application\/(pdf|epub\+zip)$/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype) || 
                     file.mimetype === "application/pdf" ||
                     file.mimetype === "application/epub+zip";
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and EPUB files are allowed"));
    }
  }
});

// Combined upload middleware (handles both images and files).
// We intentionally DO NOT use a fileFilter here, because we validate file types
// later in the route handler based on the file extension. This avoids
// MulterError: Unexpected field issues and keeps validation logic in one place.
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(ext);
      const uploadDir = isImage ? "uploads/images" : "uploads/files";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Conversation routes
router.post("/conversation", auth, chatController.getOrCreateConversation);
router.post("/conversation/group", auth, chatController.createGroupChat);
router.get("/conversations", auth, chatController.getUserConversations);
router.post("/conversation/:conversationId/members", auth, chatController.addGroupMembers);

// Message routes
router.get("/conversation/:conversationId/messages", auth, chatController.getMessages);

// Serve uploaded files
router.use("/uploads", express.static("uploads"));

module.exports = { router, upload, uploadImage, uploadFile };

