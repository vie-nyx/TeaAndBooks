import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import PostCard from "./PostCard";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    // Don't fetch if user is not authenticated
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null" || !user) {
      console.warn("Cannot fetch posts: user not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/api/posts/feed");
      setPosts(res.data || []);
    } catch (err) {
      console.error("Error fetching posts", err);
      // Don't redirect - let the user stay on the page
      // If it's a 401, the token might be invalid but we're already on dashboard
      if (err.response?.status === 401) {
        console.warn("Unauthorized - token may be expired. Please refresh the page.");
      }
      setPosts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }

    const handler = () => {
      fetchPosts();
    };
    window.addEventListener("posts:refresh", handler);
    return () => {
      window.removeEventListener("posts:refresh", handler);
    };
  }, [user, fetchPosts]);

  return (
    <div className="feed-inner">
      {loading && (
        <>
          <div className="post-skeleton" />
          <div className="post-skeleton" />
        </>
      )}
      {!loading && posts.length === 0 && (
        <div className="post-card" style={{ padding: 20, textAlign: "center" }}>
          <p>No posts yet. Be the first to share something ✨</p>
        </div>
      )}
      {!loading &&
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onUpdated={(updated) => {
              setPosts((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
              );
            }}
          />
        ))}
    </div>
  );
}


