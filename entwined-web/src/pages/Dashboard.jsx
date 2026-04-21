import React, { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/Dashboard.css";
import Chat from "../components/Chat";
import CreatePost from "../components/CreatePost";
import PostFeed from "../components/PostFeed";
import ProfileDashboard from "../components/profile/ProfileDashboard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("chat"); // "chat", "feed", "friends", or "profile"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);

  

  const fetchRequests = async () => {
    const inRes = await api.get("/api/friends/incoming");
    const outRes = await api.get("/api/friends/outgoing");

    setIncoming(inRes.data);
    setOutgoing(outRes.data);
  };

  const fetchFriends = async () => {
    const res = await api.get("/api/friends/list");
    setFriends(res.data);
  };
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
  const searchUsers = async (value) => {
    setQuery(value);
    if (!value.trim()) return setResults([]);

    const res = await api.get(
      `/api/friends/search?username=${value}`
    );
    setResults(res.data);
  };

  const sendRequest = async (username) => {
    await api.post("/api/friends/request", { username });
    alert("Request sent");
    fetchRequests();
  };

  const acceptRequest = async (id) => {
    await api.post(`/api/friends/accept/${id}`);
    fetchRequests();
    fetchFriends();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={`tab-button ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          Feed
        </button>
        <button
          className={`tab-button ${activeTab === "friends" ? "active" : ""}`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
        <button
          className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
      </div>

      {activeTab === "chat" ? (
        <Chat />
      ) : activeTab === "feed" ? (
        <div className="feed-layout">
          <PostFeed />
          <CreatePost />
        </div>
      ) : activeTab === "profile" ? (
        <div className="feed-layout">
          <ProfileDashboard />
        </div>
      ) : (
        <div className="dashboard-card">
          <h2>Search Users</h2>

          <input
            className="search-input"
            placeholder="Search username..."
            value={query}
            onChange={(e) => searchUsers(e.target.value)}
          />

          {results.map(user => (
            <div key={user._id} className="user-result">
              <span>{user.username}</span>
              <button onClick={() => sendRequest(user.username)}>
                Add
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 30 }}>Incoming Requests</h2>
          {incoming.map(req => (
            <div key={req._id} className="user-result">
              <span>{req.sender.username}</span>
              <button onClick={() => acceptRequest(req._id)}>
                Accept
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 30 }}>Outgoing Requests</h2>
          {outgoing.map(req => (
            <div key={req._id} className="user-result">
              <span>{req.receiver.username}</span>
            </div>
          ))}

          <h2 style={{ marginTop: 30 }}>Friends</h2>
          {friends.map(friend => (
            <div key={friend._id} className="user-result">
              <span>{friend.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}