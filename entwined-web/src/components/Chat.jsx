import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Chat.css";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      joinConversation(selectedConversation._id);
    }
    
    return () => {
      if (selectedConversation && socket) {
        socket.emit("conversation:leave", { conversationId: selectedConversation._id });
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", handleNewMessage);
    socket.on("message:notification", handleMessageNotification);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("message:new");
      socket.off("message:notification");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/chat/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await api.get("/api/friends/list");
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await api.get(`/api/chat/conversation/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const joinConversation = (conversationId) => {
    if (socket && selectedConversation) {
      socket.emit("conversation:leave", { conversationId: selectedConversation._id });
    }
    if (socket && conversationId) {
      socket.emit("conversation:join", { conversationId });
    }
  };

  const handleNewMessage = (message) => {
    if (selectedConversation && message.conversationId === selectedConversation._id) {
      setMessages((prev) => [...prev, message]);
    }
    fetchConversations(); // Update conversation list
  };

  const handleMessageNotification = ({ conversationId, message }) => {
    fetchConversations(); // Update conversation list
  };

  const handleTypingStart = ({ conversationId, userId }) => {
    if (selectedConversation && conversationId === selectedConversation._id) {
      setTypingUsers((prev) => new Set([...prev, userId]));
    }
  };

  const handleTypingStop = ({ conversationId, userId }) => {
    if (selectedConversation && conversationId === selectedConversation._id) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUserOnline = ({ userId }) => {
    // Update online status if needed
  };

  const handleUserOffline = ({ userId }) => {
    // Update offline status if needed
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append("conversationId", selectedConversation._id);
      formData.append("text", messageText);

      await api.post("/api/chat/message", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessageText("");
      stopTyping();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf", "application/epub+zip"];
    const ext = file.name.toLowerCase().split(".").pop();
    const isAllowed = allowedTypes.includes(file.type) || 
                     ["pdf", "epub"].includes(ext) ||
                     file.type === "application/octet-stream" && ["pdf", "epub"].includes(ext);

    if (!isAllowed) {
      alert("Only images (JPEG, PNG, GIF, WebP), PDF, and EPUB files are allowed");
      fileInputRef.current.value = "";
      return;
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      fileInputRef.current.value = "";
      return;
    }

    // Show preview
    setPreviewFile({
      file,
      type: file.type.startsWith("image/") ? "image" : ext === "pdf" ? "pdf" : "epub",
      name: file.name,
      size: file.size
    });
  };

  const handleFileUpload = async () => {
    if (!previewFile || !selectedConversation) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("conversationId", selectedConversation._id);
      formData.append("file", previewFile.file);

      console.log("Uploading file:", previewFile.name, "Size:", previewFile.size);
      console.log("Conversation ID:", selectedConversation._id);

      // Don't set Content-Type header - browser will set it with boundary
      const response = await api.post("/api/chat/message", formData);
      
      console.log("File uploaded successfully:", response.data);

      setPreviewFile(null);
      fileInputRef.current.value = "";
      
      // Refresh messages to show the new file
      if (selectedConversation) {
        fetchMessages(selectedConversation._id);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Error uploading file. Please try again.";
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL}${fileUrl}`;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTyping = () => {
    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      socket.emit("typing:start", { conversationId: selectedConversation._id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (isTyping && selectedConversation) {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: selectedConversation._id });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFriendClick = async (friend) => {
    try {
      const res = await api.post("/api/chat/conversation", { friendId: friend._id });
      setSelectedConversation(res.data);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) return;

    try {
      const res = await api.post("/api/chat/conversation/group", {
        groupName,
        friendIds: selectedFriends.map(f => f._id)
      });
      setConversations((prev) => [res.data, ...prev]);
      setSelectedConversation(res.data);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedFriends([]);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const toggleFriendSelection = (friend) => {
    setSelectedFriends((prev) =>
      prev.find(f => f._id === friend._id)
        ? prev.filter(f => f._id !== friend._id)
        : [...prev, friend]
    );
  };

  const getConversationName = (conversation) => {
    if (conversation.type === "group") {
      return conversation.groupName;
    }
    const currentUserId = getCurrentUserId();
    const otherUser = conversation.participants.find(
      p => p._id?.toString() !== currentUserId?.toString()
    );
    return otherUser?.username || "Unknown";
  };

  const getCurrentUserId = () => {
    return user?._id;
  };

  return (
    <div className="chat-container">
      <div className="chat-left-panel">
        <div className="chat-header">
          <h2>Messages</h2>
          <button
            className="create-group-btn"
            onClick={() => setShowGroupModal(true)}
          >
            + Group
          </button>
        </div>

        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-item ${
                selectedConversation?._id === conv._id ? "active" : ""
              }`}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="conversation-info">
                <div className="conversation-name">{getConversationName(conv)}</div>
                {conv.lastMessage && (
                  <div className="conversation-preview">
                    {conv.lastMessage.text || 
                     (conv.lastMessage.imageUrl ? "📷 Image" : 
                      conv.lastMessage.fileUrl ? `📎 ${conv.lastMessage.fileName || "File"}` : 
                      "Message")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="friends-list">
          <h3>Friends</h3>
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="friend-item"
              onClick={() => handleFriendClick(friend)}
            >
              {friend.username}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-right-panel">
        {selectedConversation ? (
          <>
            <div className="chat-header-bar">
              <h3>{getConversationName(selectedConversation)}</h3>
              {!isConnected && <span className="connection-status">Disconnected</span>}
            </div>

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`message ${
                    message.sender._id?.toString() === getCurrentUserId()?.toString() ? "sent" : "received"
                  }`}
                >
                  {message.imageUrl && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${message.imageUrl}`}
                      alt="Shared"
                      className="message-image"
                    />
                  )}
                  {message.fileUrl && (
                    <div className="message-file" onClick={() => downloadFile(message.fileUrl, message.fileName)}>
                      <div className="file-icon">
                        {message.fileType === "pdf" ? "📄" : message.fileType === "epub" ? "📚" : "📎"}
                      </div>
                      <div className="file-info">
                        <div className="file-name">{message.fileName || "File"}</div>
                        {message.fileSize && (
                          <div className="file-size">{formatFileSize(message.fileSize)}</div>
                        )}
                      </div>
                      <div className="file-download-icon">⬇️</div>
                    </div>
                  )}
                  {message.text && <div className="message-text">{message.text}</div>}
                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              ))}
              {typingUsers.size > 0 && (
                <div className="typing-indicator">
                  {Array.from(typingUsers).map((userId) => (
                    <span key={userId}>Someone is typing...</span>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {previewFile && (
              <div className="file-preview">
                <div className="file-preview-content">
                  {previewFile.type === "image" && (
                    <img
                      src={URL.createObjectURL(previewFile.file)}
                      alt="Preview"
                      className="file-preview-image"
                    />
                  )}
                  {(previewFile.type === "pdf" || previewFile.type === "epub") && (
                    <div className="file-preview-icon">
                      {previewFile.type === "pdf" ? "📄" : "📚"}
                    </div>
                  )}
                  <div className="file-preview-info">
                    <div className="file-preview-name">{previewFile.name}</div>
                    <div className="file-preview-size">{formatFileSize(previewFile.size)}</div>
                  </div>
                </div>
                <div className="file-preview-actions">
                  <button
                    type="button"
                    className="cancel-preview-btn"
                    onClick={cancelPreview}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="upload-file-btn"
                    onClick={handleFileUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Send File"}
                  </button>
                </div>
              </div>
            )}

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf,.epub"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file (Image, PDF, EPUB)"
              >
                📎
              </button>
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                disabled={uploading}
              />
              <button type="submit" className="send-btn" disabled={uploading}>
                {uploading ? "..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation or friend to start chatting</p>
          </div>
        )}
      </div>

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Group Chat</h2>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-input"
            />
            <div className="friends-selection">
              {friends.map((friend) => (
                <label key={friend._id} className="friend-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFriends.some(f => f._id === friend._id)}
                    onChange={() => toggleFriendSelection(friend)}
                  />
                  {friend.username}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button onClick={handleCreateGroup}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

