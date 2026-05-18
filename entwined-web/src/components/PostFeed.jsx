import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import PostCard from "./PostCard";
import { POST_CATEGORIES } from "../constants/postCategories";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();

  const categoryBreakdown = useMemo(() => {
    const counts = allPosts.reduce((acc, post) => {
      const key = post.category || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return POST_CATEGORIES.map((category) => ({
      ...category,
      count:
        category.value === "all"
          ? allPosts.length
          : counts[category.value] || 0
    }));
  }, [allPosts]);

  const topCategories = useMemo(() => {
    return categoryBreakdown
      .filter((category) => category.value !== "all")
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [categoryBreakdown]);

  const totalLikes = useMemo(() => {
    return posts.reduce(
      (sum, post) => sum + ((post.likes && post.likes.length) || 0),
      0
    );
  }, [posts]);

  const fetchPosts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null" || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const filteredQuery = new URLSearchParams();

      if (selectedCategory !== "all") {
        filteredQuery.set("category", selectedCategory);
      }

      if (searchQuery.trim()) {
        filteredQuery.set("search", searchQuery.trim());
      }

      const [filteredRes, allRes] = await Promise.all([
        api.get(
          `/api/posts/feed${
            filteredQuery.toString() ? `?${filteredQuery.toString()}` : ""
          }`
        ),
        api.get("/api/posts/feed")
      ]);

      setPosts(filteredRes.data || []);
      setAllPosts(allRes.data || []);
    } catch (err) {
      console.error("Error fetching posts", err);
      setPosts([]);
      setAllPosts([]);
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
      <section className="feed-page">
        <aside className="feed-sidebar feed-sidebar-left">
          <div className="feed-side-card feed-audience-card">
            <p className="feed-side-label">Global Timeline</p>
            <h3>{user?.username ? `Hey @${user.username}` : "Hey reader"}</h3>
            <p>
              This feed shows posts from every reader on Entwined, not just your
              friends or the people you follow.
            </p>
          </div>

          <div className="feed-side-card">
            <h4>Categories</h4>
            <div className="feed-quick-list">
              {categoryBreakdown.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`feed-quick-item ${
                    selectedCategory === category.value ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <span>
                    {category.value === "all" ? "All posts" : category.label}
                  </span>
                  <strong>{loading ? "-" : category.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="feed-main-column">
          <div className="feed-composer-card">
            <div className="feed-composer-copy">
              <p className="feed-eyebrow">Add Post</p>
              <h3>Share with readers</h3>
            </div>
            <button
              type="button"
              className="feed-composer-button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("posts:openComposer"))
              }
            >
              Create post
            </button>
          </div>

          <div className="feed-search-card">
            <label className="feed-search-shell">
              <span className="feed-search-label">Search post</span>
              <input
                className="feed-search-input"
                type="search"
                placeholder="Search by caption, category, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

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
        </div>

        <aside className="feed-sidebar feed-sidebar-right">
          <div className="feed-side-card">
            <h4>Feed snapshot</h4>
            <div className="feed-metric-grid">
              <div className="feed-metric-card">
                <span>Visible posts</span>
                <strong>{loading ? "..." : posts.length}</strong>
              </div>
              <div className="feed-metric-card">
                <span>Total likes</span>
                <strong>{loading ? "..." : totalLikes}</strong>
              </div>
            </div>
          </div>

          <div className="feed-side-card">
            <h4>Trending shelves</h4>
            <div className="feed-trending-list">
              {topCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className="feed-trending-item"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <span>{category.label}</span>
                  <strong>{loading ? "-" : category.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
