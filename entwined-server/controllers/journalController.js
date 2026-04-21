const JournalEntry = require("../models/JournalEntry");

const listJournalEntries = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const isOwner = targetUserId.toString() === req.userId.toString();

    const query = isOwner
      ? { user: targetUserId }
      : { user: targetUserId, isPublic: true };

    const entries = await JournalEntry.find(query).sort({ createdAt: -1 });
    return res.json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch journal entries" });
  }
};

const createJournalEntry = async (req, res) => {
  try {
    const { content, moodTags = [], isPublic = false } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const entry = await JournalEntry.create({
      user: req.userId,
      content: content.trim(),
      moodTags: Array.isArray(moodTags)
        ? moodTags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 8)
        : [],
      isPublic: Boolean(isPublic),
    });

    return res.status(201).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create journal entry" });
  }
};

const updateJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    if (entry.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { content, moodTags, isPublic } = req.body;
    if (content !== undefined) entry.content = content.trim();
    if (moodTags !== undefined) {
      entry.moodTags = Array.isArray(moodTags)
        ? moodTags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 8)
        : [];
    }
    if (isPublic !== undefined) entry.isPublic = Boolean(isPublic);
    await entry.save();
    return res.json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update entry" });
  }
};

const deleteJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    if (entry.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await JournalEntry.findByIdAndDelete(entry._id);
    return res.json({ message: "Entry deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to delete entry" });
  }
};

module.exports = {
  listJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
};
