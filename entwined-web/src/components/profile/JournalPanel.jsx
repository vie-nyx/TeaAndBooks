import { useState, useRef, useEffect } from "react";

const quickMoods = [
  { emoji: "😊", label: "happy" },
  { emoji: "😢", label: "sad" },
  { emoji: "😡", label: "angry" },
  { emoji: "🤩", label: "excited" },
  { emoji: "😴", label: "tired" },
  { emoji: "😌", label: "calm" },
  { emoji: "🤔", label: "thoughtful" },
  { emoji: "📚", label: "reading" },
  { emoji: "☕", label: "cozy" }
];

const emojiGrid = [
  "😊", "😀", "😂", "😍", "🥳", "😎", "🤔", "😴", "😢", "😭", "😡", "😱", "😌", "🤩",
  "📚", "📖", "🔖", "✍", "📝", "💡", "🧠", "☕", "🍵", "🎨", "🎵", "✨", "❤️", "👍"
];

const getTagStyles = (tag) => {
  const t = tag.toLowerCase().trim();
  if (t.includes("happy") || t.includes("😊") || t.includes("joy") || t.includes("cheerful")) {
    return { bg: "rgba(34, 197, 94, 0.1)", color: "#16a34a", border: "rgba(34, 197, 94, 0.2)" };
  }
  if (t.includes("sad") || t.includes("😢") || t.includes("blue") || t.includes("down") || t.includes("cry")) {
    return { bg: "rgba(59, 130, 246, 0.1)", color: "#2563eb", border: "rgba(59, 130, 246, 0.2)" };
  }
  if (t.includes("angry") || t.includes("😡") || t.includes("mad") || t.includes("annoyed")) {
    return { bg: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "rgba(239, 68, 68, 0.2)" };
  }
  if (t.includes("excited") || t.includes("🤩") || t.includes("hype") || t.includes("thrilled")) {
    return { bg: "rgba(234, 179, 8, 0.1)", color: "#ca8a04", border: "rgba(234, 179, 8, 0.2)" };
  }
  if (t.includes("tired") || t.includes("😴") || t.includes("sleepy") || t.includes("exhausted")) {
    return { bg: "rgba(107, 114, 128, 0.1)", color: "#4b5563", border: "rgba(107, 114, 128, 0.2)" };
  }
  if (t.includes("calm") || t.includes("😌") || t.includes("relaxed") || t.includes("peaceful")) {
    return { bg: "rgba(16, 185, 129, 0.1)", color: "#059669", border: "rgba(16, 185, 129, 0.2)" };
  }
  if (t.includes("thoughtful") || t.includes("🤔") || t.includes("anxious") || t.includes("worried") || t.includes("nervous")) {
    return { bg: "rgba(139, 92, 246, 0.1)", color: "#7c3aed", border: "rgba(139, 92, 246, 0.2)" };
  }
  if (t.includes("read") || t.includes("📚") || t.includes("book")) {
    return { bg: "rgba(168, 85, 247, 0.1)", color: "#9333ea", border: "rgba(168, 85, 247, 0.2)" };
  }
  if (t.includes("cozy") || t.includes("☕") || t.includes("tea") || t.includes("coffee")) {
    return { bg: "rgba(249, 115, 22, 0.1)", color: "#ea580c", border: "rgba(249, 115, 22, 0.2)" };
  }
  return { bg: "rgba(148, 163, 184, 0.1)", color: "#475569", border: "rgba(148, 163, 184, 0.2)" };
};

export default function JournalPanel({
  entries,
  entryDraft,
  setEntryDraft,
  onCreateEntry,
  isCurrentUser,
}) {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Auto-grow textarea to fit content and prevent scrollbar clipping
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [entryDraft.content]);

  const toggleMoodTag = (moodLabel) => {
    const currentTags = entryDraft.moodTags
      ? entryDraft.moodTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const index = currentTags.indexOf(moodLabel);
    let newTags;
    if (index > -1) {
      newTags = currentTags.filter((t) => t !== moodLabel);
    } else {
      newTags = [...currentTags, moodLabel];
    }
    setEntryDraft((prev) => ({
      ...prev,
      moodTags: newTags.join(", "),
    }));
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setEntryDraft((prev) => ({
        ...prev,
        content: prev.content + emoji,
      }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setEntryDraft((prev) => ({
      ...prev,
      content: before + emoji + after,
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  const getActiveTags = () => {
    return entryDraft.moodTags
      ? entryDraft.moodTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];
  };

  const activeTags = getActiveTags();

  return (
    <div className="profile-tab-panel">
      <div className="journal-header-row">
        <h3>Reading Journal</h3>
      </div>

      {isCurrentUser && (
        <div className="journal-card">
          <div className="journal-textarea-wrapper">
            <textarea
              ref={textareaRef}
              id="journal-textarea"
              placeholder="Write a journal entry..."
              value={entryDraft.content}
              onChange={(e) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
            />
          </div>

          <div className="journal-editor-toolbar">
            <div className="journal-quick-moods">
              <span className="toolbar-label">Feeling:</span>
              <div className="moods-list">
                {quickMoods.map((mood) => {
                  const isActive = activeTags.includes(mood.label);
                  return (
                    <button
                      key={mood.label}
                      type="button"
                      className={`mood-select-btn ${isActive ? "active" : ""}`}
                      onClick={() => toggleMoodTag(mood.label)}
                      title={`Toggle ${mood.label} tag`}
                    >
                      <span>{mood.emoji}</span>
                      <span className="mood-btn-label">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <button
                type="button"
                className="emoji-trigger-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Insert emoji"
              >
                😀 Add Emoji
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker-popover">
                  {emojiGrid.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        insertEmoji(emoji);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="journal-tags-input-container">
            <input
              placeholder="Add custom tags (comma separated)"
              value={entryDraft.moodTags}
              onChange={(e) =>
                setEntryDraft((prev) => ({
                  ...prev,
                  moodTags: e.target.value,
                }))
              }
            />
          </div>

          <div className="journal-card-footer">
            <label className="journal-public-toggle">
              <input
                type="checkbox"
                checked={entryDraft.isPublic}
                onChange={(e) =>
                  setEntryDraft((prev) => ({
                    ...prev,
                    isPublic: e.target.checked,
                  }))
                }
              />
              Public entry
            </label>

            <button
              type="button"
              className="journal-save-btn"
              onClick={onCreateEntry}
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      <div className="journal-list">
        {entries.length === 0 ? (
          <div className="journal-empty-state">
            <p>No journal entries yet. Start writing down your thoughts!</p>
          </div>
        ) : (
          entries.map((entry) => {
            const dateStr = entry.createdAt
              ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Date Unknown";

            return (
              <div key={entry._id} className="journal-entry">
                <div className="journal-entry-header">
                  <span className="journal-entry-date">{dateStr}</span>
                  {entry.isPublic ? (
                    <span className="entry-status-badge public" title="Visible to everyone">
                      🌐 Public
                    </span>
                  ) : (
                    <span className="entry-status-badge private" title="Visible only to you">
                      🔒 Private
                    </span>
                  )}
                </div>

                <p className={`journal-entry-content ${expandedEntry === entry._id ? "expanded" : "collapsed"}`}>
                  {entry.content}
                </p>

                <div className="journal-entry-footer">
                  <button
                    className="expand-btn"
                    onClick={() =>
                      setExpandedEntry(
                        expandedEntry === entry._id ? null : entry._id
                      )
                    }
                  >
                    {expandedEntry === entry._id ? "Show Less" : "Read More"}
                  </button>

                  <div className="journal-tags">
                    {(entry.moodTags || []).map((tag, idx) => {
                      const styles = getTagStyles(tag);
                      return (
                        <span
                          key={idx}
                          className="mood-tag"
                          style={{
                            backgroundColor: styles.bg,
                            color: styles.color,
                            borderColor: styles.border,
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
