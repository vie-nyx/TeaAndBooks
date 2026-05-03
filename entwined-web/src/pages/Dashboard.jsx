
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Dashboard.css";

import Chat from "../components/Chat";
import CreatePost from "../components/CreatePost";
import PostFeed from "../components/PostFeed";
import ProfileDashboard from "../components/profile/ProfileDashboard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("chat");
  const [menuOpen, setMenuOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const loadData = async () => {
      try {
        const inRes = await api.get("/api/friends/incoming");
        const outRes = await api.get("/api/friends/outgoing");
        const friendsRes = await api.get("/api/friends/list");

        setIncoming(inRes.data);
        setOutgoing(outRes.data);
        setFriends(friendsRes.data);
      } catch (err) {
        console.log(err);
      }
    };

    loadData();
  }, []);

  const fetchRequests = async () => {
    try {
      const inRes = await api.get("/api/friends/incoming");
      const outRes = await api.get("/api/friends/outgoing");

      setIncoming(inRes.data);
      setOutgoing(outRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await api.get("/api/friends/list");
      setFriends(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const searchUsers = async (value) => {
    setQuery(value);

    if (!value.trim()) {
      return setResults([]);
    }

    try {
      const res = await api.get(
        `/api/friends/search?username=${value}`
      );

      setResults(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const sendRequest = async (username) => {
    try {
      await api.post("/api/friends/request", {
        username,
      });

      alert("Request sent");

      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const acceptRequest = async (id) => {
    try {
      await api.post(`/api/friends/accept/${id}`);

      fetchRequests();
      fetchFriends();
    } catch (err) {
      console.log(err);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* =========================
          NAVIGATION BAR
      ========================= */}

      <nav className="dashboard-nav">
        <div className="nav-logo">Entwined</div>

        {/* Hamburger Menu */}
        <div
          className="hamburger-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={menuOpen ? "bar open" : "bar"}></div>
          <div className={menuOpen ? "bar open" : "bar"}></div>
          <div className={menuOpen ? "bar open" : "bar"}></div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`dashboard-tabs ${
            menuOpen ? "mobile-show" : ""
          }`}
        >
          <button
            className={`tab-button ${
              activeTab === "chat" ? "active" : ""
            }`}
            onClick={() => handleTabClick("chat")}
          >
            Chat
          </button>

          <button
            className={`tab-button ${
              activeTab === "feed" ? "active" : ""
            }`}
            onClick={() => handleTabClick("feed")}
          >
            Feed
          </button>

          <button
            className={`tab-button ${
              activeTab === "friends" ? "active" : ""
            }`}
            onClick={() => handleTabClick("friends")}
          >
            Friends
          </button>

          <button
            className={`tab-button ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => handleTabClick("profile")}
          >
            Profile
          </button>
        </div>
      </nav>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="dashboard-content">
        {/* CHAT */}
        {activeTab === "chat" ? (
          <Chat />
        ) : activeTab === "feed" ? (
          /* FEED */
          <div className="feed-layout">
            <PostFeed />
            <CreatePost />
          </div>
        ) : activeTab === "profile" ? (
          /* PROFILE */
          <div className="feed-layout">
            <ProfileDashboard />
          </div>
        ) : (
          /* FRIENDS */
          <div className="dashboard-card">
            {/* =========================
                LEFT PANEL
            ========================= */}

            <div className="friends-main-panel">
              {/* SEARCH USERS */}
              <div className="friends-section">
                <h2>Search Users</h2>

                <input
                  className="search-input"
                  placeholder="Search username..."
                  value={query}
                  onChange={(e) =>
                    searchUsers(e.target.value)
                  }
                />

                {results.length > 0 ? (
                  results.map((user) => (
                    <div
                      key={user._id}
                      className="user-result"
                    >
                      <span>{user.username}</span>

                      <button
                        onClick={() =>
                          sendRequest(user.username)
                        }
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">
                    Search for readers and book
                    lovers.
                  </p>
                )}
              </div>

              {/* INCOMING REQUESTS */}
              <div className="friends-section">
                <h2>Incoming Requests</h2>

                {incoming.length > 0 ? (
                  incoming.map((req) => (
                    <div
                      key={req._id}
                      className="user-result"
                    >
                      <span>
                        {req.sender.username}
                      </span>

                      <button
                        onClick={() =>
                          acceptRequest(req._id)
                        }
                      >
                        Accept
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">
                    No incoming requests yet.
                  </p>
                )}
              </div>
            </div>

            {/* =========================
                RIGHT PANEL
            ========================= */}

            <div className="friends-side-panel">
              <h2>Friends</h2>

              {friends.length > 0 ? (
  friends.map((friend) => (
    <div
      key={friend._id}
      className="user-result clickable-user"
      onClick={() =>
        navigate(`/profile/${friend._id}`)
      }
    >
      <span>{friend.username}</span>
    </div>
  ))
) : (
                <p className="empty-state">
                  Your reading circle is empty.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
