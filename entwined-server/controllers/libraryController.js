const Library = require("../models/Library");
const User = require("../models/User");
const { buildReadingStats } = require("../utils/readingStats");

const SHELVES = ["read", "currentlyReading", "wantToRead"];

const ensureLibrary = async (userId) => {
  let library = await Library.findOne({ user: userId });
  if (!library) {
    library = await Library.create({ user: userId, read: [], currentlyReading: [], wantToRead: [] });
  }
  return library;
};

const persistStats = async (userId, library) => {
  const readingStats = buildReadingStats(library);
  await User.findByIdAndUpdate(userId, { $set: { readingStats } });
  return readingStats;
};

const getMyLibrary = async (req, res) => {
  try {
    const library = await ensureLibrary(req.userId);
    const readingStats = await persistStats(req.userId, library);
    return res.json({ library, readingStats });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch library" });
  }
};

const addBook = async (req, res) => {
  try {
    const { shelf = "wantToRead", book } = req.body;
    if (!SHELVES.includes(shelf) || !book?.title) {
      return res.status(400).json({ message: "Valid shelf and book title are required" });
    }

    const library = await ensureLibrary(req.userId);
    const normalizedBook = {
      bookId: book.bookId || "",
      title: book.title,
      author: book.author || "",
      coverImage: book.coverImage || "",
      notes: book.notes || "",
      addedAt: new Date(),
      startedAt: book.startedAt || null,
      finishedAt: book.finishedAt || null,
    };

    SHELVES.forEach((shelfName) => {
      library[shelfName] = library[shelfName].filter(
        (item) => !(item.bookId && normalizedBook.bookId && item.bookId === normalizedBook.bookId)
          && item.title.toLowerCase() !== normalizedBook.title.toLowerCase(),
      );
    });

    library[shelf].push(normalizedBook);
    await library.save();
    const readingStats = await persistStats(req.userId, library);
    return res.json({ library, readingStats });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to add book" });
  }
};

const removeBook = async (req, res) => {
  try {
    const { shelf, bookEntryId } = req.params;
    if (!SHELVES.includes(shelf)) {
      return res.status(400).json({ message: "Invalid shelf" });
    }

    const library = await ensureLibrary(req.userId);
    library[shelf] = library[shelf].filter((book) => book._id.toString() !== bookEntryId);
    await library.save();
    const readingStats = await persistStats(req.userId, library);
    return res.json({ library, readingStats });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to remove book" });
  }
};

const moveBook = async (req, res) => {
  try {
    const { fromShelf, toShelf, bookEntryId } = req.body;
    if (!SHELVES.includes(fromShelf) || !SHELVES.includes(toShelf)) {
      return res.status(400).json({ message: "Invalid shelves" });
    }

    const library = await ensureLibrary(req.userId);
    const index = library[fromShelf].findIndex((book) => book._id.toString() === bookEntryId);
    if (index === -1) {
      return res.status(404).json({ message: "Book not found in source shelf" });
    }

    const [book] = library[fromShelf].splice(index, 1);
    if (toShelf === "currentlyReading" && !book.startedAt) book.startedAt = new Date();
    if (toShelf === "read" && !book.finishedAt) book.finishedAt = new Date();

    library[toShelf].push(book);
    await library.save();
    const readingStats = await persistStats(req.userId, library);
    return res.json({ library, readingStats });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to move book" });
  }
};
const getUserLibrary = async (req, res) => {
  try {
    const library = await Library.findOne({
      user: req.params.userId,
    });

    if (!library) {
      return res.json({
        library: {
          read: [],
          currentlyReading: [],
          wantToRead: [],
        },
      });
    }

    return res.json({ library });
  } catch (err) {
    return res.status(500).json({
      message:
        err.message ||
        "Failed to fetch library",
    });
  }
};
module.exports = {
  getMyLibrary,
  addBook,
  removeBook,
  moveBook,
  getUserLibrary,
};
