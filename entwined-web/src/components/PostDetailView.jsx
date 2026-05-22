import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PostCard from "./PostCard";

export default function PostDetailView({ postId }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setError("Post not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      console.error("Failed to fetch post", err);
      setError(err.response?.data?.error || "Unable to load post.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return (
    <div className="single-post-view">
      <div className="single-post-toolbar">
        <button type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {loading && <div className="post-card">Loading post...</div>}
      {!loading && error && <div className="post-card">{error}</div>}
      {!loading && !error && post && (
        <PostCard
          post={post}
          onUpdated={(updated) => setPost(updated)}
        />
      )}
    </div>
  );
}
