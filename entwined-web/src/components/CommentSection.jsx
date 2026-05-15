import { Link } from "react-router-dom";

export default function CommentSection({ comments }) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div>
      {comments.map((comment) => {
        const username = comment.user?.username || "Reader";
        const profilePath = comment.user?._id
          ? `/profile/${comment.user._id}`
          : null;
        return (
          <div key={comment._id} className="comment-item">
            {profilePath ? (
              <Link to={profilePath} className="comment-username profile-link">
                @{username}
              </Link>
            ) : (
              <span className="comment-username">@{username}</span>
            )}
            <span>{comment.text}</span>
          </div>
        );
      })}
    </div>
  );
}


