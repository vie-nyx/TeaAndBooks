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
const groupGoalRoutes = require("./routes/groupGoalRoutes");
const profileRoutes = require("./routes/profileRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const journalRoutes = require("./routes/journalRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");

const { initializeSocket } = require("./socket/socketHandler");

const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const Post = require("./models/Post");
const SharedPost = require("./models/SharedPost");

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
    methods: ["GET", "POST","PUT","DELETE","OPTIONS"],
    credentials: true
  }
});

initializeSocket(io);

/*
========================
MIDDLEWARE (VERY IMPORTANT ORDER)
========================
*/

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))

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
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/reviews", reviewRoutes);

// ✅ Chat routes
app.use("/api/chat", chatRoutes);

// ✅ Group goals routes (AFTER middleware)
app.use("/api/chat", groupGoalRoutes);

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

      const { conversationId, text, postId } = req.body;
      let sharedPost = null;
      if (postId) {
        sharedPost = await Post.findById(postId);
        if (!sharedPost) {
          return res.status(404).json({
            message: "Post not found",
          });
        }
      }

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

        if (isImage) {
          imageUrl = req.file.path;
          fileType = "image";
        } else if (ext === ".pdf" || ext === ".epub") {
          fileUrl = req.file.path;
          fileType = ext === ".pdf" ? "pdf" : "epub";
          fileName = req.file.originalname;
          fileSize = req.file.size;
        } else {
          return res.status(400).json({
            message: "Unsupported file type"
          });
        }
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
      await message.populate("postId", "caption imageUrl user createdAt");
      if (message.postId) {
        await message.populate({
          path: "postId",
          populate: { path: "user", select: "username profileImage" },
        });
      }

      if (sharedPost) {
        await SharedPost.create({
          post: sharedPost._id,
          sharedBy: userId,
          conversation: conversationId,
          message: message._id,
          note: text || "",
        });
      }

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

      res.json(message);

    } catch (err) {

      console.error("Error uploading message:", err);

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

  console.error("Global error:", error);

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

  return res.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });

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