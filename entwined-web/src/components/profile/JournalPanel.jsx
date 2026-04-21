export default function JournalPanel({
  entries,
  entryDraft,
  setEntryDraft,
  onCreateEntry,
}) {
  return (
    <div className="journal-card">
      <h3>Reading Journal</h3>
      <textarea
        placeholder="Write a journal entry..."
        value={entryDraft.content}
        onChange={(e) => setEntryDraft((prev) => ({ ...prev, content: e.target.value }))}
      />
      <input
        placeholder="Mood tags (comma separated)"
        value={entryDraft.moodTags}
        onChange={(e) => setEntryDraft((prev) => ({ ...prev, moodTags: e.target.value }))}
      />
      <label className="journal-public-toggle">
        <input
          type="checkbox"
          checked={entryDraft.isPublic}
          onChange={(e) => setEntryDraft((prev) => ({ ...prev, isPublic: e.target.checked }))}
        />
        Public entry
      </label>
      <button type="button" onClick={onCreateEntry}>
        Save Entry
      </button>

      <div className="journal-list">
        {entries.map((entry) => (
          <div key={entry._id} className="journal-entry">
            <p>{entry.content}</p>
            <small>{(entry.moodTags || []).join(", ")}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
