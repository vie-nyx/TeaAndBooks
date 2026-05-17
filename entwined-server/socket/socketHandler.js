const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// Store online users (userId -> Set of socketIds) and typing indicators
const onlineUsers = new Map(); 
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

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    // === MULTI-TAB PRESENCE TRACKING SYSTEM ===
    if (!onlineUsers.has(userId)) {
      // First tab opened: Initialize the tracking set
      onlineUsers.set(userId, new Set());

      try {
        // Update database presence status flags
        await User.findByIdAndUpdate(userId, { isOnline: true });
        
        // Broadcast to everyone else that this user is now online
        socket.broadcast.emit("user:online", { userId });
      } catch (err) {
        console.error(`Error updating online status for user ${userId}:`, err);
      }
    }
    
    // Track this specific socket connection session instance
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);
    console.log(`User ${userId} connected (Session: ${socket.id}). Total tabs open: ${onlineUsers.get(userId).size}`);

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
    socket.on("disconnect", async () => {
      if (onlineUsers.has(userId)) {
        const userConnections = onlineUsers.get(userId);
        
        // Remove this specific closing tab's socket ID
        userConnections.delete(socket.id);
        
        // If no active connections remain, the user is completely offline
        if (userConnections.size === 0) {
          onlineUsers.delete(userId);
          const offlineTimestamp = new Date();

          try {
            // Persist changes in MongoDB fields
            await User.findByIdAndUpdate(userId, { 
              isOnline: false, 
              lastSeen: offlineTimestamp 
            });
            
            // Broadcast offline state with the updated timestamp out to peer clients
            socket.broadcast.emit("user:offline", { 
              userId, 
              lastSeen: offlineTimestamp 
            });
          } catch (err) {
            console.error(`Error updating offline status for user ${userId}:`, err);
          }
          
          console.log(`User ${userId} went completely offline.`);
        } else {
          console.log(`User ${userId} closed a tab. Remaining open tabs: ${userConnections.size}`);
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocket, onlineUsers };