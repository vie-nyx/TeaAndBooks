import { useState } from "react";
import api from "../api/api";

export default function CommentInput({ postId, onNewComment }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/posts/comment/${postId}`, {
        text: text.trim(),
      });
      if (onNewComment) {
        onNewComment(res.data);
      }
      setText("");
    } catch (err) {
      console.error("Error adding comment", err);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-input-row" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting || !text.trim()}>
        {submitting ? "..." : "Post"}
      </button>
    </form>
  );
}


