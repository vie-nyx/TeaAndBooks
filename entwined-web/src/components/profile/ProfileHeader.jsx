export default function ProfileHeader({
  profile,
  isCurrentUser,
  isFollowing,
  onFollowToggle,
  onSaveProfile,
  editing,
  onEditToggle,
  draftProfile,
  setDraftProfile,
}) {
  const resolvedImage = profile.profileImage || "https://ui-avatars.com/api/?name=Reader&background=1f2937&color=ffffff";
  const safeBio = profile.bio || "No bio added yet";
  const safePersona = profile.readingPersona || "Reader";
  const safeGenres = (profile.favoriteGenres || []).filter(Boolean);

  return (
    <div className="profile-header-card">
      <div className="profile-header-main">
        <div className="profile-avatar">
          {resolvedImage ? (
            <img src={resolvedImage} alt={`${profile.username} avatar`} />
          ) : (
            (profile.username || "R").slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="profile-header-info">
          <h2>@{profile.username}</h2>
          <p>{safeBio}</p>
          <div className="profile-meta-row">
            <span>{profile.followersCount || 0} followers</span>
            <span>{profile.followingCount || 0} following</span>
            <span>{safePersona}</span>
          </div>
          <div className="profile-genre-pills">
            {safeGenres.length === 0 && <span className="genre-pill">Not specified</span>}
            {safeGenres.map((genre) => (
              <span key={genre} className="genre-pill">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-header-actions">
        {isCurrentUser ? (
          <>
            <button type="button" onClick={onEditToggle}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            {editing && (
              <button type="button" onClick={onSaveProfile}>
                Save
              </button>
            )}
          </>
        ) : (
          <button type="button" onClick={onFollowToggle}>
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {isCurrentUser && editing && (
        <div className="profile-edit-grid">
          <input
            placeholder="Profile image URL"
            value={draftProfile.profileImage}
            onChange={(e) =>
              setDraftProfile((prev) => ({ ...prev, profileImage: e.target.value }))
            }
          />
          <input
            placeholder="Reading persona"
            value={draftProfile.readingPersona}
            onChange={(e) =>
              setDraftProfile((prev) => ({ ...prev, readingPersona: e.target.value }))
            }
          />
          <textarea
            placeholder="Bio"
            value={draftProfile.bio}
            onChange={(e) =>
              setDraftProfile((prev) => ({ ...prev, bio: e.target.value }))
            }
          />
          <input
            placeholder="Favorite genres (comma separated)"
            value={draftProfile.favoriteGenres}
            onChange={(e) =>
              setDraftProfile((prev) => ({ ...prev, favoriteGenres: e.target.value }))
            }
          />
        </div>
      )}
    </div>
  );
}
