const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comments");
const PostLike = require("../models/PostLike");
const { POST_CATEGORIES } = require("../constants/postCategories");

const { uploadImage } = require("../middleware/upload");

const bucket = require("../config/firebase");

// Use relaxed auth here so both classic and Google JWTs work,
// without changing existing strict authMiddleware behavior.
const auth = require("../middleware/authRelaxed");

const normalizeCategory = (value) => {
  if (!value || typeof value !== "string") {
    return "general";
  }

  const normalizedValue = value.trim().toLowerCase();
  return POST_CATEGORIES.includes(normalizedValue)
    ? normalizedValue
    : null;
};



/* ===========================
   CREATE POST
=========================== */

router.post("/create", auth, uploadImage.single("image"), async (req, res) => {
  try {

    console.log("===== CREATE POST REQUEST =====");
    console.log("Headers:", req.headers);
    console.log("User ID:", req.userId);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    if (!req.userId) {
      console.log("Auth failed: userId missing");
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      console.log("Upload failed: image missing");
      return res.status(400).json({ error: "Image is required" });
    }

    // Cloudinary automatically uploads the file
    const imageUrl = req.file.path;
    const category = normalizeCategory(req.body.category);

    if (!category) {
      return res.status(400).json({ message: "Invalid post category" });
    }

    console.log("Cloudinary image URL:", imageUrl);

    const post = await Post.create({
      user: req.userId,
      caption: req.body.caption || "",
      category,
      imageUrl
    });

    console.log("Post created:", post._id);

    await User.findByIdAndUpdate(req.userId, {
      $push: { posts: post._id }
    });

    console.log("User updated with new post");

    res.json(post);

  } catch (err) {
    console.error("Unexpected error in create post:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ===========================
   GET GLOBAL FEED
=========================== */

router.get("/feed", auth, async (req, res) => {
  try {

    console.log("===== FETCH FEED =====");
    console.log("User requesting feed:", req.userId);

    const category = req.query.category?.toString().trim().toLowerCase();
    const search = req.query.search?.toString().trim().toLowerCase() || "";

    if (category && category !== "all" && !POST_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category filter" });
    }

    const query = {};

    if (category && category !== "all") {
      query.category = category;

      if (category === "general") {
        delete query.category;
        query.$or = [
          { category: "general" },
          { category: { $exists: false } }
        ];
      }
    }

    const posts = await Post.find(query)
      .populate("user", "username profileImage")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profileImage" }
      })
      .sort({ createdAt: -1 });

    const filteredPosts = search
      ? posts.filter((post) => {
          const searchableText = [
            post.caption,
            post.category,
            post.user?.username
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(search);
        })
      : posts;

    console.log("Total posts fetched:", filteredPosts.length);

    res.json(filteredPosts);

  } catch (err) {
    console.error("Feed fetch error:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});


/* ===========================
   FRIENDS FEED
=========================== */

router.get("/friends-feed", auth, async (req, res) => {
  try {

    console.log("===== FETCH FRIENDS FEED =====");
    console.log("User:", req.userId);

    const user = await User.findById(req.userId);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const ids = [...user.following, req.userId];

    console.log("Fetching posts from users:", ids);

    const posts = await Post.find({
      user: { $in: ids }
    })
      .populate("user", "username profileImage")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profileImage" }
      })
      .sort({ createdAt: -1 });

    console.log("Posts returned:", posts.length);

    res.json(posts);

  } catch (err) {
    console.error("Friends feed error:", err);
    res.status(500).json({ error: "Failed to fetch friends feed" });
  }
});


/* ===========================
   LIKE / UNLIKE POST
=========================== */

router.post("/like/:postId", auth, async (req, res) => {
  try {

    console.log("===== LIKE POST =====");
    console.log("User:", req.userId);
    console.log("Post ID:", req.params.postId);

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(req.userId);

    if (alreadyLiked) {
      console.log("User already liked post → removing like");
      post.likes.pull(req.userId);
      await PostLike.deleteOne({ post: post._id, user: req.userId });
    } else {
      console.log("Adding like to post");
      post.likes.push(req.userId);
      await PostLike.updateOne(
        { post: post._id, user: req.userId },
        { $setOnInsert: { post: post._id, user: req.userId } },
        { upsert: true }
      );
    }

    await post.save();

    console.log("Post likes updated. Total likes:", post.likes.length);

    res.json(post);

  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
});


/* ===========================
   ADD COMMENT
=========================== */

router.post("/comment/:postId", auth, async (req, res) => {
  try {

    console.log("===== ADD COMMENT =====");
    console.log("User:", req.userId);
    console.log("Post:", req.params.postId);
    console.log("Comment text:", req.body.text);

    if (!req.body.text) {
      return res.status(400).json({ error: "Comment text required" });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await Comment.create({
      user: req.userId,
      post: req.params.postId,
      text: req.body.text
    });

    console.log("Comment created:", comment._id);

    await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: comment._id } }
    );

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "username profileImage");

    console.log("Comment added to post");

    res.json(populatedComment);

  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

/* ===========================
   GET COMMENTS FOR POST
=========================== */

router.get("/comments/:postId", auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username profileImage")
      .sort({ createdAt: 1 });

    return res.json(comments);
  } catch (err) {
    console.error("Comments fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});


module.exports = router;
