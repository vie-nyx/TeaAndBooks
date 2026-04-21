import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CommentSection from "./CommentSection";
import CommentInput from "./CommentInput";
import { useAuth } from "../contexts/AuthContext";

export default function PostCard({ post, onUpdated }) {
  const [optimisticPost, setOptimisticPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sharingToId, setSharingToId] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setOptimisticPost(post);
  }, [post]);

  const userHasLiked = useMemo(() => {
    if (!currentUser?._id || !optimisticPost?.likes) return false;
    return optimisticPost.likes.some(
      (likeUserId) => likeUserId?.toString() === currentUser._id.toString(),
    );
  }, [currentUser?._id, optimisticPost?.likes]);

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

  const fetchConversations = async () => {
    if (loadingConversations || conversations.length > 0) return;
    setLoadingConversations(true);
    try {
      const res = await api.get("/api/chat/conversations");
      setConversations(res.data || []);
    } catch (err) {
      console.error("Error fetching conversations for share", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleShareClick = async () => {
    const next = !showSharePanel;
    setShowSharePanel(next);
    if (next) {
      await fetchConversations();
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === "group") return conversation.groupName;
    const other = (conversation.participants || []).find(
      (participant) => participant?._id?.toString() !== currentUser?._id?.toString(),
    );
    return other?.username || "Conversation";
  };

  const handleShareToConversation = async (conversationId) => {
    if (!conversationId || sharingToId) return;
    setSharingToId(conversationId);
    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("postId", optimisticPost._id);
      if (shareNote.trim()) {
        formData.append("text", shareNote.trim());
      }
      await api.post("/api/chat/message", formData);
      setShowSharePanel(false);
      setShareNote("");
    } catch (err) {
      console.error("Error sharing post", err);
      alert("Failed to share post. Please try again.");
    } finally {
      setSharingToId(null);
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
          <button
            type="button"
            className="post-action-secondary"
            onClick={() => setShowComments((prev) => !prev)}
          >
            {(optimisticPost.comments || []).length} comments
          </button>
          <button
            type="button"
            className="post-action-secondary"
            onClick={handleShareClick}
          >
            Share
          </button>
        </div>

        {showComments && (
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
        )}

        {showSharePanel && (
          <div className="share-panel">
            <textarea
              className="share-note-input"
              placeholder="Add a note (optional)"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              maxLength={400}
            />
            <div className="share-conversations">
              {loadingConversations && <p>Loading conversations...</p>}
              {!loadingConversations && conversations.length === 0 && (
                <p>No conversations available yet.</p>
              )}
              {!loadingConversations &&
                conversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation._id}
                    className="share-conversation-btn"
                    onClick={() => handleShareToConversation(conversation._id)}
                    disabled={sharingToId === conversation._id}
                  >
                    {sharingToId === conversation._id
                      ? "Sharing..."
                      : `Send to ${getConversationName(conversation)}`}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}


