const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const postRoutes = require("./routes/posts");
const { router: chatRoutes, upload } = require("./routes/chatRoutes");

const { initializeSocket } = require("./socket/socketHandler");

const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const auth = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);

/*
========================
SOCKET.IO SETUP
========================
*/

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

initializeSocket(io);

/*
========================
MIDDLEWARE
========================
*/

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/*
========================
DATABASE
========================
*/

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/*
========================
ROUTES
========================
*/

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);

/*
========================
MESSAGE CREATION
(UPLOAD + TEXT)
========================
*/

app.post("/api/chat/message",
  auth,
  (req, res, next) => {

    upload.single("file")(req, res, (err) => {

      if (err) {
        console.error("Upload error:", err);

        if (err instanceof multer.MulterError) {

          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "File too large. Maximum size is 50MB"
            });
          }

          return res.status(400).json({
            message: err.message || "File upload error"
          });
        }

        return res.status(400).json({
          message: err.message || "File upload error"
        });
      }

      next();
    });

  },

  async (req, res) => {

    try {

      console.log("File upload request received");

      console.log("File:",
        req.file
          ? `${req.file.originalname} (${req.file.size} bytes)`
          : "No file"
      );

      console.log("Body:", {
        conversationId: req.body.conversationId,
        text: req.body.text
      });

      const { conversationId, text, postId } = req.body;
      const userId = req.userId;

      if (!conversationId) {
        return res.status(400).json({
          message: "Conversation ID is required"
        });
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found"
        });
      }

      if (!conversation.participants.some(id => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      let imageUrl = null;
      let fileUrl = null;
      let fileType = null;
      let fileName = null;
      let fileSize = null;

      /*
      ========================
      FILE PROCESSING
      ========================
      */

      if (req.file) {

        const ext = path.extname(req.file.originalname).toLowerCase();
        const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(ext);

        console.log("Cloudinary file URL:", req.file.path);

        if (isImage) {

          imageUrl = req.file.path;
          fileType = "image";

          console.log("Image uploaded to Cloudinary:", imageUrl);

        } else if (ext === ".pdf" || ext === ".epub") {

          fileUrl = req.file.path;
          fileType = ext === ".pdf" ? "pdf" : "epub";
          fileName = req.file.originalname;
          fileSize = req.file.size;

          console.log("File uploaded to Cloudinary:", fileUrl);

        } else {

          return res.status(400).json({
            message: "Unsupported file type"
          });

        }

      } else {

        console.log("No file attached");

      }

      /*
      ========================
      CREATE MESSAGE
      ========================
      */

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

      /*
      ========================
      SOCKET EMIT
      ========================
      */

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
      console.error("Stack:", err.stack);

      res.status(500).json({
        message: err.message || "Error uploading message"
      });

    }

  }
);

/*
========================
GLOBAL ERROR HANDLER
========================
*/

app.use((error, req, res, next) => {

  console.error("Global error handler:", error);

  if (error instanceof multer.MulterError) {

    if (error.code === "LIMIT_FILE_SIZE") {

      return res.status(400).json({
        message: "File too large. Maximum size is 50MB"
      });

    }

    return res.status(400).json({
      message: error.message || "File upload error"
    });
  }

  if (error) {

    return res.status(error.status || 500).json({
      message: error.message || "Internal server error"
    });

  }

  next();
});

/*
========================
START SERVER
========================
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);