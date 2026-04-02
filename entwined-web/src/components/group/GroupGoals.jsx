import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/GroupGoals.css";

export default function GroupGoals({ conversationId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    bookTitle: "",
    weeklyGoal: "",
    meetingDate: "",
    lastMeetingNotes: "",
    isActive: false // ✅ FIX: don't default to true
  });

  const [editingId, setEditingId] = useState(null);

  /*
  =================================
  FETCH GOALS
  =================================
  */
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/chat/group/${conversationId}/goals`);
      setGoals(res.data);
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    fetchGoals();
  }, [conversationId]);

  /*
  =================================
  SORT GOALS (ACTIVE FIRST)
  =================================
  */
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1;
  });

  /*
  =================================
  SUBMIT (CREATE / UPDATE)
  =================================
  */
  const handleSubmit = async () => {
    if (!form.bookTitle || !form.weeklyGoal) return;

    try {
      const payload = {
        ...form,
        meetingDate: form.meetingDate
          ? new Date(form.meetingDate)
          : null
      };

      if (editingId) {
        await api.put(`/api/chat/group/goals/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post(`/api/chat/group/${conversationId}/goals`, payload);
      }

      setForm({
        bookTitle: "",
        weeklyGoal: "",
        meetingDate: "",
        lastMeetingNotes: "",
        isActive: false
      });

      fetchGoals();
    } catch (err) {
      console.error("Error saving goal:", err);
    }
  };

  /*
  =================================
  EDIT GOAL
  =================================
  */
  const handleEdit = (goal) => {
    setForm({
      bookTitle: goal.bookTitle || "",
      weeklyGoal: goal.weeklyGoal || "",
      meetingDate: goal.meetingDate
        ? new Date(goal.meetingDate).toISOString().slice(0, 16)
        : "",
      lastMeetingNotes: goal.lastMeetingNotes || "",
      isActive: goal.isActive ?? false
    });

    setEditingId(goal._id);
  };

  /*
  =================================
  SET ACTIVE GOAL
  =================================
  */
  const handleSetActive = async (goalId) => {
    try {
      await api.put(`/api/chat/group/goals/${goalId}`, {
        isActive: true
      });
  
      // ✅ update UI instantly
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          isActive: g._id === goalId
        }))
      );
  
    } catch (err) {
      console.error("Error setting active goal:", err);
    }
  };
  /*
  =================================
  UI
  =================================
  */
  return (
    <div className="goals-container">
      <h3>📚 Group Goals</h3>

      {/* FORM */}
      <div className="goal-form">
        <input
          placeholder="Book Title"
          value={form.bookTitle}
          onChange={(e) =>
            setForm({ ...form, bookTitle: e.target.value })
          }
        />

        <input
          placeholder="Weekly Goal"
          value={form.weeklyGoal}
          onChange={(e) =>
            setForm({ ...form, weeklyGoal: e.target.value })
          }
        />

        {/* ✅ FIXED datetime input */}
        <input
          type="datetime-local"
          value={form.meetingDate || ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              meetingDate: e.target.value
            }))
          }
        />

        <textarea
          placeholder="Meeting Notes"
          value={form.lastMeetingNotes}
          onChange={(e) =>
            setForm({ ...form, lastMeetingNotes: e.target.value })
          }
        />

        <button onClick={handleSubmit}>
          {editingId ? "Update Goal" : "Set Goal"}
        </button>
      </div>

      {/* LIST */}
      <div className="goals-list">
        {loading ? (
          <p>Loading...</p>
        ) : goals.length === 0 ? (
          <p>No goals yet</p>
        ) : (
          sortedGoals.map((g) => (
            <div
              key={g._id}
              className={`goal-card ${g.isActive ? "active" : ""}`}
            >
              <h4>{g.bookTitle}</h4>

              <p>🎯 {g.weeklyGoal}</p>

              {g.meetingDate && (
                <p>📅 {new Date(g.meetingDate).toLocaleString()}</p>
              )}

              {g.lastMeetingNotes && (
                <p>📝 {g.lastMeetingNotes}</p>
              )}

              <div className="goal-actions">
                <button onClick={() => handleEdit(g)}>Edit</button>

                {!g.isActive && (
                  <button onClick={() => handleSetActive(g._id)}>
                    Set Active
                  </button>
                )}
              </div>

              {g.isActive && (
                <span className="active-badge">🔥 Active Goal</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}