import { useState } from "react";
import api from "../api/api";
import CommentSection from "./CommentSection";
import CommentInput from "./CommentInput";

export default function PostCard({ post, onUpdated }) {
  const [optimisticPost, setOptimisticPost] = useState(post);
  const [liking, setLiking] = useState(false);

  const userHasLiked = false;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`/api/posts/like/${optimisticPost._id}`);
      setOptimisticPost(res.data);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      console.error("Error liking post", err);
    } finally {
      setLiking(false);
    }
  };

  const { user, imageUrl, caption } = optimisticPost;
  const username = user?.username || "Reader";
  const profileImage = user?.profileImage;

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-user-avatar">
          {profileImage ? (
            <img src={profileImage} alt={`${username} profile`} />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        <div className="post-username">@{username}</div>
      </header>

      <div className="post-image-wrapper">
        <img src={imageUrl} alt="Post" />
      </div>

      <div className="post-body">
        {caption && <div className="post-caption">{caption}</div>}

        <div className="post-actions">
          <button
            type="button"
            className={`like-button ${userHasLiked ? "liked" : ""}`}
            onClick={handleLike}
            disabled={liking}
          >
            <span>♥</span>
            <span>{liking ? "…" : "Like"}</span>
          </button>
          <span className="likes-count">
            {(optimisticPost.likes || []).length} likes
          </span>
        </div>

        <div className="comments-section">
          <CommentSection comments={optimisticPost.comments || []} />
          <CommentInput
            postId={optimisticPost._id}
            onNewComment={(comment) => {
              setOptimisticPost((prev) => ({
                ...prev,
                comments: [...(prev.comments || []), comment],
              }));
              if (onUpdated) {
                onUpdated({
                  ...optimisticPost,
                  comments: [...(optimisticPost.comments || []), comment],
                });
              }
            }}
          />
        </div>
      </div>
    </article>
  );
}


