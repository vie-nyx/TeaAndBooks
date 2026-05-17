import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import PostCard from "./PostCard";
import {
  POST_CATEGORIES,
  getPostCategoryLabel
} from "../constants/postCategories";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null" || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (selectedCategory !== "all") {
        query.set("category", selectedCategory);
      }

      if (searchQuery.trim()) {
        query.set("search", searchQuery.trim());
      }

      const res = await api.get(
        `/api/posts/feed${query.toString() ? `?${query.toString()}` : ""}`
      );
      setPosts(res.data || []);
    } catch (err) {
      console.error("Error fetching posts", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, user]);

  useEffect(() => {
    if (!user) return undefined;

    const timer = window.setTimeout(() => {
      fetchPosts();
    }, searchQuery.trim() ? 220 : 0);

    const handler = () => {
      fetchPosts();
    };

    window.addEventListener("posts:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("posts:refresh", handler);
    };
  }, [user, fetchPosts, searchQuery]);

  return (
    <div className="feed-inner">
      <section className="feed-shell">
        <div className="feed-hero">
          <div>
            <p className="feed-eyebrow">Reader Feed</p>
            <h2>Browse posts by mood, moment, and reading obsession.</h2>
            <p className="feed-subcopy">
              Search captions, usernames, or jump straight into a category that
              matches what you want to discover.
            </p>
          </div>
          <div className="feed-summary-card">
            <strong>{loading ? "..." : posts.length}</strong>
            <span>
              {selectedCategory === "all"
                ? "posts in the current feed"
                : `${getPostCategoryLabel(selectedCategory)} posts`}
            </span>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="feed-search-shell">
            <span className="feed-search-label">Search the feed</span>
            <input
              className="feed-search-input"
              type="search"
              placeholder="Search by caption, category, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div className="feed-categories">
            {POST_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`feed-category-chip ${
                  selectedCategory === category.value ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="feed-results-copy">
            {searchQuery.trim()
              ? `Results for "${searchQuery.trim()}" in ${getPostCategoryLabel(selectedCategory)}`
              : `Showing ${getPostCategoryLabel(selectedCategory)} posts`}
          </div>
        )}

        {loading && (
          <>
            <div className="post-skeleton" />
            <div className="post-skeleton" />
          </>
        )}

        {!loading && posts.length === 0 && (
          <div className="feed-empty-state">
            <h3>No posts matched this filter yet.</h3>
            <p>
              Try another category, clear your search, or create the first post
              in this lane.
            </p>
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
      </section>
    </div>
  );
}
