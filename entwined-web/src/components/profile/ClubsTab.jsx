export default function ClubsTab({ clubs }) {
  return (
    <div className="profile-tab-panel">
      {clubs.length === 0 ? (
        <p>No book clubs joined yet.</p>
      ) : (
        clubs.map((club) => (
          <div key={club._id} className="club-card">
            <h4>{club.groupName}</h4>
            <p>Members: {(club.participants || []).length}</p>
          </div>
        ))
      )}
    </div>
  );
}
