import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/Dashboard.css";

import Chat from "../components/Chat";
import CreatePost from "../components/CreatePost";
import PostFeed from "../components/PostFeed";
import ProfileDashboard from "../components/profile/ProfileDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState(
    location.pathname.includes(
      "/dashboard/profile/"
    )
      ? "profile"
      : "chat"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);

  // 1. Sync activeTab with URL changes
 

  // 2. Fetch initial social data
  const fetchRequests = useCallback(async () => {
    try {
      const [inRes, outRes] = await Promise.all([
        api.get("/api/friends/incoming"),
        api.get("/api/friends/outgoing"),
      ]);
      setIncoming(inRes.data);
      setOutgoing(outRes.data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  }, []);
  useEffect(() => {
    if (
      location.pathname.includes(
        "/dashboard/profile/"
      )
    ) {
      setActiveTab("profile");
    }
  }, [location.pathname]);
  const fetchFriends = useCallback(async () => {
    try {
      const res = await api.get("/api/friends/list");
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchFriends();
  }, [fetchRequests, fetchFriends]);

  // 3. Action Handlers
  const searchUsers = async (value) => {
    setQuery(value);
    if (!value.trim()) return setResults([]);
    try {
      const res = await api.get(`/api/friends/search?username=${value}`);
      setResults(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const sendRequest = async (username) => {
    try {
      await api.post("/api/friends/request", { username });
      alert("Request sent");
      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await api.post(`/api/friends/accept/${requestId}`);
      fetchRequests();
      fetchFriends();
    } catch (err) {
      console.log(err);
    }
  };

  const handleTabClick = (tab) => {
    setMenuOpen(false);
  
    if (tab === "profile") {
      setActiveTab("profile");
      navigate("/dashboard/profile/me");
      return;
    }
  
    setActiveTab(tab);
    navigate("/dashboard");
  };
  return (
    <div className="dashboard-container">
      {/* NAVIGATION BAR */}
      <nav className="dashboard-nav">
        <div className="nav-logo" onClick={() => navigate("/dashboard")} style={{cursor: 'pointer'}}>
          Entwined
        </div>

        <div className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <div className={menuOpen ? "bar open" : "bar"}></div>
          <div className={menuOpen ? "bar open" : "bar"}></div>
          <div className={menuOpen ? "bar open" : "bar"}></div>
        </div>

        <div className={`dashboard-tabs ${menuOpen ? "mobile-show" : ""}`}>
          <button
            className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => handleTabClick("chat")}
          >
            Chat
          </button>
          <button
            className={`tab-button ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => handleTabClick("feed")}
          >
            Feed
          </button>
          <button
            className={`tab-button ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => handleTabClick("friends")}
          >
            Friends
          </button>
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => handleTabClick("profile")}
          >
            Profile
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        {activeTab === "chat" && <Chat />}

        {activeTab === "feed" && (
          <div className="feed-layout">
            <PostFeed />
            <CreatePost />
          </div>
        )}

{(
  activeTab === "profile" ||
  location.pathname.includes(
    "/dashboard/profile/"
  )
) && (
  <div className="feed-layout">
    <ProfileDashboard
      key={id || "own-profile"}
    />
  </div>
)}

        {activeTab === "friends" && (
          <div className="dashboard-card">
            <div className="friends-main-panel">
              <div className="friends-section">
                <h2>Search Users</h2>
                <input
                  className="search-input"
                  placeholder="Search username..."
                  value={query}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {results.length > 0 ? (
                  results.map((user) => (
                    <div key={user._id} className="user-result">
                      <span>{user.username}</span>
                      <button onClick={() => sendRequest(user.username)}>Add</button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">Search for readers and book lovers.</p>
                )}
              </div>

              <div className="friends-section">
                <h2>Incoming Requests</h2>
                {incoming.length > 0 ? (
                  incoming.map((req) => (
                    <div key={req._id} className="user-result">
                      <span>{req.sender.username}</span>
                      <button onClick={() => acceptRequest(req._id)}>Accept</button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No incoming requests yet.</p>
                )}
              </div>
            </div>

            <div className="friends-side-panel">
              <h2>Friends</h2>
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="user-result clickable-user"
                    onClick={() =>
                      navigate(
                        `/dashboard/profile/${friend._id}`
                      )
                    }
                  >
                    <span>{friend.username}</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">Your reading circle is empty.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}