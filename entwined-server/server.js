const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const { router: chatRoutes, upload } = require("./routes/chatRoutes");
const { initializeSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
initializeSocket(io);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chat", chatRoutes);

// Message creation endpoint with file/image upload
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const auth = require("./middleware/authMiddleware");
const path = require("path");

app.post("/api/chat/message", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File too large. Maximum size is 50MB" });
        }
        return res.status(400).json({ message: err.message || "File upload error" });
      }
      // File filter error or other multer errors
      return res.status(400).json({ message: err.message || "File upload error" });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log("File upload request received");
    console.log("File:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
    console.log("Body:", { conversationId: req.body.conversationId, text: req.body.text });
    
    const { conversationId, text, postId } = req.body;
    const userId = req.user;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let imageUrl = null;
    let fileUrl = null;
    let fileType = null;
    let fileName = null;
    let fileSize = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(ext);
      
      console.log(`Processing file: ${req.file.originalname}, extension: ${ext}, isImage: ${isImage}`);
      
      if (isImage) {
        imageUrl = `/api/chat/uploads/images/${req.file.filename}`;
        fileType = "image";
        console.log(`Image saved to: ${imageUrl}`);
      } else if (ext === ".pdf" || ext === ".epub") {
        fileUrl = `/api/chat/uploads/files/${req.file.filename}`;
        fileType = ext === ".pdf" ? "pdf" : "epub";
        fileName = req.file.originalname;
        fileSize = req.file.size;
        console.log(`File saved to: ${fileUrl}, type: ${fileType}`);
      } else {
        console.log(`Unsupported file type: ${ext}`);
        return res.status(400).json({ message: "Unsupported file type" });
      }
    } else {
      console.log("No file in request");
    }

    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text || "",
      imageUrl,
      fileUrl,
      fileType,
      fileName,
      fileSize,
      postId: postId || null
    });

    await message.populate("sender", "username avatar");

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit via socket
    io.to(`conversation:${conversationId}`).emit("message:new", message);

    const participantIds = conversation.participants
      .filter(id => id.toString() !== userId.toString())
      .map(id => id.toString());

    participantIds.forEach(participantId => {
      io.to(`user:${participantId}`).emit("message:notification", {
        conversationId,
        message
      });
    });

    console.log("Message created successfully:", message._id);
    res.json(message);
  } catch (err) {
    console.error("Error uploading message:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: err.message || "Error uploading file" });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 50MB" });
    }
    return res.status(400).json({ message: error.message || "File upload error" });
  }
  if (error) {
    return res.status(error.status || 500).json({ 
      message: error.message || "Internal server error" 
    });
  }
  next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));