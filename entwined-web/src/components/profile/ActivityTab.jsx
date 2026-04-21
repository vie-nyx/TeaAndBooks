export default function ActivityTab({ activity }) {
  const likes = activity?.likes || [];
  const comments = activity?.comments || [];
  const shares = activity?.shares || [];

  return (
    <div className="profile-tab-panel">
      <div className="activity-grid">
        <div className="activity-card">
          <h3>Likes</h3>
          {likes.length === 0 ? (
            <p>No likes yet.</p>
          ) : (
            likes.map((item) => (
              <p key={item._id}>
                Liked: {item.post?.caption || "Untitled post"}
              </p>
            ))
          )}
        </div>
        <div className="activity-card">
          <h3>Comments</h3>
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((item) => (
              <p key={item._id}>
                {item.text}
              </p>
            ))
          )}
        </div>
        <div className="activity-card">
          <h3>Shares</h3>
          {shares.length === 0 ? (
            <p>No shares yet.</p>
          ) : (
            shares.map((item) => (
              <p key={item._id}>
                Shared: {item.post?.caption || "post"}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
