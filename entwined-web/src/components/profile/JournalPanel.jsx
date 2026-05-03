import { useState } from "react";
export default function JournalPanel({
  entries,
  entryDraft,
  setEntryDraft,
  onCreateEntry,
  isCurrentUser,
}) {
  const [expandedEntry, setExpandedEntry] = useState(null);
  return (
    
      <div>
        <h3>Reading Journal</h3>

{isCurrentUser && (
  <>
    <textarea
      placeholder="Write a journal entry..."
      value={entryDraft.content}
      onChange={(e) =>
        setEntryDraft((prev) => ({
          ...prev,
          content: e.target.value,
        }))
      }
    />

    <input
      placeholder="Mood tags (comma separated)"
      value={entryDraft.moodTags}
      onChange={(e) =>
        setEntryDraft((prev) => ({
          ...prev,
          moodTags: e.target.value,
        }))
      }
    />

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
      onClick={onCreateEntry}
    >
      Save Entry
    </button>
  </>
)}
      <div className="journal-list">
        {entries.map((entry) => (
          <div key={entry._id} className="journal-entry">
            <p className={expandedEntry === entry._id ? "expanded" : "collapsed"}>
  {entry.content}
</p>

<button
  className="expand-btn"
  onClick={() =>
    setExpandedEntry(
      expandedEntry === entry._id
        ? null
        : entry._id
    )
  }
>
  {expandedEntry === entry._id
    ? "Show Less"
    : "Read More"}
</button>
            <small>{(entry.moodTags || []).join(", ")}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
