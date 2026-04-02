export default function CreateGroupModal({
    friends,
    groupName,
    setGroupName,
    selectedFriends,
    toggleFriendSelection,
    onClose,
    onCreate,
    groupType,
    setGroupType
  }) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Create Group</h2>
  
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
  
          {/* 🔥 GROUP TYPE */}
          <div>
            <label>
              <input
                type="radio"
                value="discussion"
                checked={groupType === "discussion"}
                onChange={() => setGroupType("discussion")}
              />
              Discussion
            </label>
  
            <label>
              <input
                type="radio"
                value="bookclub"
                checked={groupType === "bookclub"}
                onChange={() => setGroupType("bookclub")}
              />
              Book Club
            </label>
          </div>
  
          {/* FRIENDS */}
          <div>
            {friends.map((f) => (
              <label key={f._id}>
                <input
                  type="checkbox"
                  checked={selectedFriends.some(sf => sf._id === f._id)}
                  onChange={() => toggleFriendSelection(f)}
                />
                {f.username}
              </label>
            ))}
          </div>
  
          <button onClick={onCreate}>Create</button>
        </div>
      </div>
    );
  }