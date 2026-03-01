const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// Store online users and typing indicators
const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationId -> Set of userIds

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token || 
                socket.handshake.headers?.authorization?.split(" ")[1] ||
                socket.handshake.query?.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id.toString();
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
};

const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Broadcast online status
    socket.broadcast.emit("user:online", { userId });

    console.log(`User ${userId} connected`);

    // Handle joining conversation rooms
    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.includes(userId)) {
          socket.join(`conversation:${conversationId}`);
          socket.emit("conversation:joined", { conversationId });
        } else {
          socket.emit("error", { message: "Not authorized to join this conversation" });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Handle leaving conversation rooms
    socket.on("conversation:leave", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending messages
    socket.on("message:send", async ({ conversationId, text, imageUrl, postId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found" });
        }

        if (!conversation.participants.includes(userId)) {
          return socket.emit("error", { message: "Not authorized to send messages" });
        }

        // Create message
        const message = await Message.create({
          conversationId,
          sender: userId,
          text: text || "",
          imageUrl: imageUrl || null,
          postId: postId || null
        });

        // Populate sender info
        await message.populate("sender", "username avatar");

        // Update conversation's last message
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Emit to all participants in the conversation room
        io.to(`conversation:${conversationId}`).emit("message:new", message);

        // Also notify participants who might not be in the room
        const participantIds = conversation.participants
          .filter(id => id.toString() !== userId.toString())
          .map(id => id.toString());

        participantIds.forEach(participantId => {
          io.to(`user:${participantId}`).emit("message:notification", {
            conversationId,
            message
          });
        });

      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Handle typing indicator
    socket.on("typing:start", ({ conversationId }) => {
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(userId);

      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
        if (typingUsers.get(conversationId).size === 0) {
          typingUsers.delete(conversationId);
        }
      }

      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId
      });
    });

    // Handle message read receipt
    socket.on("message:read", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            "readBy.user": { $ne: userId }
          },
          {
            $push: {
              readBy: {
                user: userId,
                readAt: new Date()
              }
            }
          }
        );

        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          userId,
          messageIds
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user:offline", { userId });
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

module.exports = { initializeSocket, onlineUsers };

