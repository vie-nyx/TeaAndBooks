const shelfLabels = {
  read: "Read",
  currentlyReading: "Currently Reading",
  wantToRead: "Want To Read",
};

export default function LibraryTab({
  library,
  onAddBook,
  onMoveBook,
  onRemoveBook,
  newBook,
  setNewBook,
  isCurrentUser,
}) {
  return (
    <div className="profile-tab-panel">
      {isCurrentUser && (
        <div className="library-add-row">
          <input
            placeholder="Book title"
            value={newBook.title}
            onChange={(e) =>
              setNewBook((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
          />

          <input
            placeholder="Author"
            value={newBook.author}
            onChange={(e) =>
              setNewBook((prev) => ({
                ...prev,
                author: e.target.value,
              }))
            }
          />

          <select
            value={newBook.shelf}
            onChange={(e) =>
              setNewBook((prev) => ({
                ...prev,
                shelf: e.target.value,
              }))
            }
          >
            {Object.entries(shelfLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button type="button" onClick={onAddBook}>
            Add Book
          </button>
        </div>
      )}
      {Object.keys(shelfLabels).map((shelf) => (
        <div key={shelf} className="library-shelf-card">
          <h3>{shelfLabels[shelf]}</h3>
          {(library?.[shelf] || []).length === 0 ? (
            <p>No books yet.</p>
          ) : (
            (library?.[shelf] || []).map((book) => (
              <div key={book._id} className="library-book-row">
                <div>
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>
                {isCurrentUser && (
                  <div className="library-book-actions">
                    <select
                      value={shelf}
                      onChange={(e) =>
                        onMoveBook({
                          fromShelf: shelf,
                          toShelf: e.target.value,
                          bookEntryId: book._id,
                        })
                      }
                    >
                      {Object.entries(shelfLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          Move to {label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onRemoveBook(shelf, book._id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
