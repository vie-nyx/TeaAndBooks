const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Friendship = require("../models/Friendship");
const User = require("../models/User");

// Get or create one-to-one conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user;

    if (userId === friendId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if users are friends
    const friendship = await Friendship.findOne({
      users: { $all: [userId, friendId] }
    });

    if (!friendship) {
      return res.status(403).json({ message: "You can only message friends" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      type: "one-to-one",
      participants: { $all: [userId, friendId], $size: 2 }
    }).populate("participants", "username avatar");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "one-to-one",
        participants: [userId, friendId]
      });
      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "username avatar");
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create group chat
const createGroupChat = async (req, res) => {
  try {
    const { groupName, friendIds } = req.body;
    const userId = req.user;

    if (!groupName || !friendIds || friendIds.length === 0) {
      return res.status(400).json({ message: "Group name and at least one friend required" });
    }

    // Verify all friendIds are friends
    const allIds = [userId, ...friendIds];
    for (const friendId of friendIds) {
      const friendship = await Friendship.findOne({
        users: { $all: [userId, friendId] }
      });
      if (!friendship) {
        return res.status(403).json({ message: `User ${friendId} is not your friend` });
      }
    }

    const conversation = await Conversation.create({
      type: "group",
      participants: allIds,
      groupName,
      groupAdmin: userId
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "username avatar")
      .populate("groupAdmin", "username");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's conversations
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "username avatar")
      .populate("groupAdmin", "username")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to view this conversation" });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add members to group
const addGroupMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { friendIds } = req.body;
    const userId = req.user;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      return res.status(403).json({ message: "Only group admin can add members" });
    }

    // Verify all friendIds are friends
    for (const friendId of friendIds) {
      const friendship = await Friendship.findOne({
        users: { $all: [userId, friendId] }
      });
      if (!friendship) {
        return res.status(403).json({ message: `User ${friendId} is not your friend` });
      }
    }

    // Add new members (avoid duplicates)
    const existingIds = conversation.participants.map(id => id.toString());
    const newIds = friendIds.filter(id => !existingIds.includes(id));
    conversation.participants.push(...newIds);
    await conversation.save();

    const populated = await Conversation.findById(conversationId)
      .populate("participants", "username avatar");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOrCreateConversation,
  createGroupChat,
  getUserConversations,
  getMessages,
  addGroupMembers
};

