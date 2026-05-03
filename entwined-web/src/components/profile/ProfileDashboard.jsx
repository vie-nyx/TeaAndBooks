import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";
import PostCard from "../PostCard";
import ProfileHeader from "./ProfileHeader";
import LibraryTab from "./LibraryTab";
import ReviewsTab from "./ReviewsTab";
import ActivityTab from "./ActivityTab";
import ClubsTab from "./ClubsTab";
import JournalPanel from "./JournalPanel";
import { useParams } from "react-router-dom";

const tabs = [
  "posts",
  "library",
  "reviews",
  "activity",
  "clubs",
  "journal",
];

export default function ProfileDashboard() {
  const { user, verifyAndFetchUser } = useAuth();

  const [activeTab, setActiveTab] = useState("posts");

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [feedback, setFeedback] = useState("");

  const [isCurrentUser, setIsCurrentUser] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);

  const [editing, setEditing] = useState(false);

  const [content, setContent] = useState({
    posts: [],
    reviews: [],
    activity: {},
    clubs: [],
  });

  const [library, setLibrary] = useState({
    read: [],
    currentlyReading: [],
    wantToRead: [],
  });

  const [entries, setEntries] = useState([]);

  const [draftProfile, setDraftProfile] = useState({
    bio: "",
    profileImage: "",
    readingPersona: "",
    favoriteGenres: "",
  });

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    shelf: "wantToRead",
  });

  const [reviewDraft, setReviewDraft] = useState({
    title: "",
    content: "",
    rating: 4,
  });

  const [entryDraft, setEntryDraft] = useState({
    content: "",
    moodTags: "",
    isPublic: false,
  });

  const { id } = useParams();

const resolvedRouteId =
  id === "me"
    ? user?._id
    : id;

const userId =
  resolvedRouteId || user?._id;

  const loadData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const profileRes = await api.get(
        `/api/profile/${userId}`
      );

      console.log("[ProfileDashboard] profile response:", profileRes.data);

      setProfile(profileRes.data.profile);
      setIsCurrentUser(profileRes.data.isCurrentUser);
      setIsFollowing(profileRes.data.isFollowing);

      const [contentRes, libraryRes, journalRes] = await Promise.all([
        api.get(`/api/profile/${userId}/content`),
        api.get(`/api/library/${userId}`),
        api.get(`/api/journal/${userId}`),
      ]);

      setContent(contentRes.data);

      setLibrary(
        libraryRes.data.library || {
          read: [],
          currentlyReading: [],
          wantToRead: [],
        }
      );

      setEntries(journalRes.data || []);
    } catch (err) {
      console.error("Failed to load profile dashboard", err);

      setError(
        err.response?.data?.message ||
          "Failed to load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [userId, loadData]);

  const readingStats = useMemo(
    () => profile?.readingStats || {},
    [profile]
  );

  const handleFollowToggle = async () => {
    if (!profile?._id) return;

    try {
      const res = await api.post(`/api/profile/${profile._id}/follow`);

      setIsFollowing(res.data.following);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: res.data.followersCount,
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to follow/unfollow", err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        bio: draftProfile.bio,
        profileImage: draftProfile.profileImage,
        readingPersona: draftProfile.readingPersona,
        favoriteGenres: draftProfile.favoriteGenres
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean),
      };

      const res = await api.put(
        "/api/profile/me/update",
        payload
      );

      setProfile(res.data.profile);

      setEditing(false);

      setFeedback("Profile updated successfully.");

      await verifyAndFetchUser();
    } catch (err) {
      console.error("Failed to save profile", err);

      setFeedback(
        err.response?.data?.message || "Failed to save profile."
      );
    }
  };

  const addBook = async () => {
    if (!newBook.title.trim()) return;

    try {
      const res = await api.post("/api/library/book", {
        shelf: newBook.shelf,
        book: {
          title: newBook.title,
          author: newBook.author,
        },
      });

      setLibrary(res.data.library);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              readingStats: res.data.readingStats,
            }
          : prev
      );

      setNewBook({
        title: "",
        author: "",
        shelf: "wantToRead",
      });
    } catch (err) {
      console.error("Failed to add book", err);
    }
  };

  const moveBook = async ({ fromShelf, toShelf, bookEntryId }) => {
    if (fromShelf === toShelf) return;

    try {
      const res = await api.patch("/api/library/move", {
        fromShelf,
        toShelf,
        bookEntryId,
      });

      setLibrary(res.data.library);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              readingStats: res.data.readingStats,
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to move book", err);
    }
  };

  const removeBook = async (shelf, bookEntryId) => {
    try {
      const res = await api.delete(
        `/api/library/book/${shelf}/${bookEntryId}`
      );

      setLibrary(res.data.library);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              readingStats: res.data.readingStats,
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to remove book", err);
    }
  };

  const createReview = async () => {
    if (
      !reviewDraft.title.trim() ||
      !reviewDraft.content.trim()
    )
      return;

    try {
      await api.post("/api/reviews", {
        title: reviewDraft.title,
        content: reviewDraft.content,
        rating: Number(reviewDraft.rating) || 4,
      });

      const contentRes = await api.get(
        `/api/profile/${userId}/content`
      );

      setContent(contentRes.data);

      setReviewDraft({
        title: "",
        content: "",
        rating: 4,
      });
    } catch (err) {
      console.error("Failed to create review", err);
    }
  };

  const createJournalEntry = async () => {
    if (!entryDraft.content.trim()) return;

    try {
      await api.post("/api/journal", {
        content: entryDraft.content,
        moodTags: entryDraft.moodTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublic: entryDraft.isPublic,
      });

      const journalRes = await api.get(`/api/journal/${userId}`);

      setEntries(journalRes.data || []);

      setEntryDraft({
        content: "",
        moodTags: "",
        isPublic: false,
      });
    } catch (err) {
      console.error("Failed to create journal entry", err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <p>{error}</p>

        <button type="button" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-card">
        <p>Profile data unavailable.</p>
      </div>
    );
  }

  return (
    <div className="profile-dashboard">
      <ProfileHeader
        profile={profile}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onSaveProfile={handleSaveProfile}
        editing={editing}
        onEditToggle={() => {
          if (!editing && profile) {
            setDraftProfile({
              bio: profile.bio || "",
              profileImage: profile.profileImage || "",
              readingPersona: profile.readingPersona || "",
              favoriteGenres: (
                profile.favoriteGenres || []
              ).join(", "),
            });
          }

          setEditing((prev) => !prev);
        }}
        draftProfile={draftProfile}
        setDraftProfile={setDraftProfile}
      />

      {feedback && (
        <div className="profile-feedback">
          {feedback}
        </div>
      )}

      <div className="reading-stats-row">
        <div className="stat-card">
          Read: {readingStats.totalBooksRead || 0}
        </div>

        <div className="stat-card">
          Reading: {readingStats.currentlyReading || 0}
        </div>

        <div className="stat-card">
          Want: {readingStats.wantToRead || 0}
        </div>

        <div className="stat-card">
          Streak: {readingStats.readingStreak || 0} days
        </div>
      </div>

      <div className="profile-subtabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={
              activeTab === tab
                ? "tab-button active"
                : "tab-button"
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "posts" && (
        <div className="profile-tab-panel">
          {(content.posts || []).map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdated={() => loadData()}
            />
          ))}
        </div>
      )}

      {activeTab === "library" && (
        <LibraryTab
          library={library}
          onAddBook={addBook}
          onMoveBook={moveBook}
          onRemoveBook={removeBook}
          newBook={newBook}
          setNewBook={setNewBook}
          isCurrentUser={isCurrentUser}
        />
      )}

      {activeTab === "reviews" && (
        <ReviewsTab
        reviews={content.reviews || []}
        reviewDraft={reviewDraft}
        setReviewDraft={setReviewDraft}
        onCreateReview={createReview}
        isCurrentUser={isCurrentUser}
      />
      )}

      {activeTab === "activity" && (
        <ActivityTab
          activity={content.activity || {}}
        />
      )}

      {activeTab === "clubs" && (
        <ClubsTab clubs={content.clubs || []} />
      )}

      {activeTab === "journal" && (
        <JournalPanel
          entries={entries}
          entryDraft={entryDraft}
          setEntryDraft={setEntryDraft}
          onCreateEntry={createJournalEntry}
          isCurrentUser={isCurrentUser}
        />
      )}
    </div>
  );
}