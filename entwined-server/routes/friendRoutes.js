const express = require("express");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/request", auth, async (req, res) => {
  const { username } = req.body;

  const receiver = await User.findOne({ username });

  if (!receiver) {
    return res.status(404).json({ message: "User not found" });
  }

  if (receiver._id.toString() === req.userId.toString()) {
    return res.status(400).json({ message: "Cannot friend yourself" });
  }

  const existing = await FriendRequest.findOne({
    sender: req.userId,
    receiver: receiver._id,
    status: "pending"
  });

  if (existing) {
    return res.status(400).json({ message: "Request already sent" });
  }

  const request = await FriendRequest.create({
    sender: req.userId,
    receiver: receiver._id
  });

  res.json(request);
});

const Friendship = require("../models/Friendship");

router.post("/accept/:id", auth, async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (request.receiver.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  request.status = "accepted";
  await request.save();

  await Friendship.create({
    users: [request.sender, request.receiver]
  });

  res.json({ message: "Friend added" });
});

router.get("/search", auth, async (req, res) => {
    const { username } = req.query;
  
    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }
  
    const users = await User.find({
      username: { $regex: username, $options: "i" }
    }).select("username email");
  
    res.json(users);
  });
  router.get("/incoming", auth, async (req, res) => {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: "pending"
    }).populate("sender", "username");
  
    res.json(requests);
  });
  router.get("/outgoing", auth, async (req, res) => {
    const requests = await FriendRequest.find({
      sender: req.userId,
      status: "pending"
    }).populate("receiver", "username");
  
    res.json(requests);
  });
  router.get("/list", auth, async (req, res) => {
    const friendships = await Friendship.find({
      users: req.userId
    }).populate("users", "username avatar profileImage name");
  
    const friends = friendships.map(f =>
      f.users.find(u => u._id.toString() !== req.userId.toString())
    );
  
    res.json(friends);
  });
module.exports = router;