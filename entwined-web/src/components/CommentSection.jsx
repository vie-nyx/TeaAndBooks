export default function CommentSection({ comments }) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div>
      {comments.map((comment) => {
        const username = comment.user?.username || "Reader";
        return (
          <div key={comment._id} className="comment-item">
            <span className="comment-username">@{username}</span>
            <span>{comment.text}</span>
          </div>
        );
      })}
    </div>
  );
}


