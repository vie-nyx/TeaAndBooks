const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const { Server } = require("socket.io");

require("dotenv").config();

/*
========================
ROUTES
========================
*/

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

/*
========================
SOCKET
========================
*/

const { initializeSocket } = require("./socket/socketHandler");

/*
========================
MODELS
========================
*/

const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const Post = require("./models/Post");
const SharedPost = require("./models/SharedPost");

/*
========================
MIDDLEWARE
========================
*/

const auth = require("./middleware/authMiddleware");

/*
========================
APP INIT
========================
*/

const app = express();
const server = http.createServer(app);

/*
========================
TRUST PROXY
IMPORTANT FOR:
- Render
- Railway
- HTTPS
- Secure Cookies
========================
*/

app.set("trust proxy", 1);

/*
========================
SOCKET.IO
========================
*/

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

initializeSocket(io);

/*
========================
SECURITY MIDDLEWARE
========================
*/

app.use(helmet());

/*
========================
COMPRESSION
========================
*/

app.use(compression());

/*
========================
RATE LIMITING
========================
*/

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use(limiter);

/*
========================
CORS
========================
*/

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/*
========================
BODY PARSER
========================
*/

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/*
========================
HEALTH CHECK
========================
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Server is running",
  });
});

/*
========================
DATABASE
========================
*/

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });

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

app.use("/api/chat", chatRoutes);
app.use("/api/chat", groupGoalRoutes);

/*
========================
MESSAGE ROUTE
========================
*/

app.post(
  "/api/chat/message",

  auth,

  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err);

        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "File too large. Maximum size is 50MB",
            });
          }

          return res.status(400).json({
            success: false,
            message: err.message || "File upload error",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }

      next();
    });
  },

  async (req, res) => {
    try {
      const { conversationId, text, postId } = req.body;

      const userId = req.userId;

      /*
      ========================
      BASIC VALIDATION
      ========================
      */

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
      }

      if (
        text &&
        typeof text === "string" &&
        text.length > 5000
      ) {
        return res.status(400).json({
          success: false,
          message: "Message exceeds maximum length",
        });
      }

      /*
      ========================
      FIND CONVERSATION
      ========================
      */

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      /*
      ========================
      AUTHORIZATION
      ========================
      */

      const isParticipant = conversation.participants.some(
        (id) => id.toString() === userId.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }

      /*
      ========================
      OPTIONAL POST SHARE
      ========================
      */

      let sharedPost = null;

      if (postId) {
        sharedPost = await Post.findById(postId);

        if (!sharedPost) {
          return res.status(404).json({
            success: false,
            message: "Post not found",
          });
        }
      }

      /*
      ========================
      FILE PROCESSING
      ========================
      */

      let imageUrl = null;
      let fileUrl = null;
      let fileType = null;
      let fileName = null;
      let fileSize = null;

      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();

        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/webp",
          "image/gif",
          "application/pdf",
          "application/epub+zip",
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: "Invalid file type",
          });
        }

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
            success: false,
            message: "Unsupported file type",
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
        postId: postId || null,
      });

      /*
      ========================
      POPULATE MESSAGE
      ========================
      */

      await message.populate("sender", "username avatar");

      await message.populate(
        "postId",
        "caption imageUrl user createdAt"
      );

      if (message.postId) {
        await message.populate({
          path: "postId",
          populate: {
            path: "user",
            select: "username profileImage",
          },
        });
      }

      /*
      ========================
      SHARED POST TRACKING
      ========================
      */

      if (sharedPost) {
        await SharedPost.create({
          post: sharedPost._id,
          sharedBy: userId,
          conversation: conversationId,
          message: message._id,
          note: text || "",
        });
      }

      /*
      ========================
      UPDATE CONVERSATION
      ========================
      */

      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();

      await conversation.save();

      /*
      ========================
      SOCKET EVENTS
      ========================
      */

      io.to(`conversation:${conversationId}`).emit(
        "message:new",
        message
      );

      const participantIds = conversation.participants
        .filter((id) => id.toString() !== userId.toString())
        .map((id) => id.toString());

      participantIds.forEach((participantId) => {
        io.to(`user:${participantId}`).emit(
          "message:notification",
          {
            conversationId,
            message,
          }
        );
      });

      /*
      ========================
      RESPONSE
      ========================
      */

      return res.status(201).json({
        success: true,
        message,
      });
    } catch (err) {
      console.error("Message creation error:", err);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

/*
========================
404 HANDLER
========================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
========================
GLOBAL ERROR HANDLER
========================
*/

app.use((error, req, res, next) => {
  console.error("Global Error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload error",
    });
  }

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

/*
========================
GRACEFUL SHUTDOWN
========================
*/

process.on("SIGINT", async () => {
  console.log("Shutting down server...");

  await mongoose.connection.close();

  console.log("MongoDB connection closed");

  process.exit(0);
});

/*
========================
START SERVER
========================
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});