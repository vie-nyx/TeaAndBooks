const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comments");
const PostLike = require("../models/PostLike");
const SharedPost = require("../models/SharedPost");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");

const pickProfileFields = (user) => ({
  _id: user._id,
  username: user.username,
  bio: user.bio || "No bio added yet",
  profileImage: user.profileImage || user.avatar || "https://ui-avatars.com/api/?name=Reader&background=1f2937&color=ffffff",
  favoriteGenres: user.favoriteGenres || [],
  readingPersona: user.readingPersona || "Reader",
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  readingStats: user.readingStats || {},
  createdAt: user.createdAt,
});

const getUserProfile = async (req, res) => {
  try {
    const target = req.params.userId === "me" ? req.userId : req.params.userId;
    const user = await User.findById(target).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const me = await User.findById(req.userId).select("following");
    const isFollowing = me?.following?.some((id) => id.toString() === user._id.toString()) || false;

    return res.json({
      profile: pickProfileFields(user),
      isCurrentUser: req.userId.toString() === user._id.toString(),
      isFollowing,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load profile" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const allowed = ["bio", "profileImage", "favoriteGenres", "readingPersona", "name"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (Array.isArray(updates.favoriteGenres)) {
      updates.favoriteGenres = updates.favoriteGenres
        .map((genre) => String(genre).trim())
        .filter(Boolean)
        .slice(0, 10);
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true })
      .select("-password -refreshToken");

    return res.json({ profile: pickProfileFields(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update profile" });
  }
};

const updateUserById = async (req, res) => {
  if (req.params.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "You can only edit your own profile" });
  }
  return updateMyProfile(req, res);
};

const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId.toString() === req.userId.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);

    if (!target) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const isFollowing = me.following.some((id) => id.toString() === targetUserId.toString());
    if (isFollowing) {
      me.following.pull(targetUserId);
      target.followers.pull(req.userId);
    } else {
      me.following.addToSet(targetUserId);
      target.followers.addToSet(req.userId);
    }

    await Promise.all([me.save(), target.save()]);

    return res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
      followingCount: me.following.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update follow state" });
  }
};

const getFollowers = async (req, res) => {
  try {
    const target = req.params.userId === "me" ? req.userId : req.params.userId;
    const user = await User.findById(target).populate("followers", "username profileImage readingPersona");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.followers || []);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch followers" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const target = req.params.userId === "me" ? req.userId : req.params.userId;
    const user = await User.findById(target).populate("following", "username profileImage readingPersona");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.following || []);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch following" });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("following");
    const blockedIds = [req.userId, ...(me.following || [])];

    const suggestions = await User.find({ _id: { $nin: blockedIds } })
      .select("username profileImage readingPersona favoriteGenres followers")
      .sort({ createdAt: -1 })
      .limit(8);

    const mapped = suggestions.map((user) => ({
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage || "",
      readingPersona: user.readingPersona || "",
      favoriteGenres: user.favoriteGenres || [],
      followersCount: user.followers?.length || 0,
    }));

    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch suggestions" });
  }
};

const getUserContent = async (req, res) => {
  try {
    const target = req.params.userId === "me" ? req.userId : req.params.userId;

    const [posts, reviews, likedPosts, comments, shares, clubs] = await Promise.all([
      Post.find({ user: target }).populate("user", "username profileImage").sort({ createdAt: -1 }).limit(20),
      Review.find({ user: target }).sort({ createdAt: -1 }).limit(20),
      PostLike.find({ user: target }).populate({
        path: "post",
        select: "caption imageUrl user createdAt",
        populate: { path: "user", select: "username profileImage" },
      }).sort({ createdAt: -1 }).limit(20),
      Comment.find({ user: target }).populate("post", "caption imageUrl").sort({ createdAt: -1 }).limit(20),
      SharedPost.find({ sharedBy: target }).populate("post", "caption imageUrl").sort({ createdAt: -1 }).limit(20),
      Conversation.find({
        type: "group",
        groupType: "bookclub",
        participants: target,
      }).select("groupName groupAdmin participants createdAt"),
    ]);

    return res.json({
      posts,
      reviews,
      activity: {
        likes: likedPosts,
        comments,
        shares,
      },
      clubs,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch user content" });
  }
};

module.exports = {
  getUserProfile,
  updateMyProfile,
  updateUserById,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
  getUserContent,
};
