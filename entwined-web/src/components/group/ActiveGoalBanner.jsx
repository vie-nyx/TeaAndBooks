import { useEffect, useState } from "react";
import api from "../../api/api";

export default function ActiveGoalBanner({ conversationId }) {
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;

    const fetchGoal = async () => {
      try {
        const res = await api.get(`/api/chat/group/${conversationId}/goals`);

        if (isMounted && res.data.length > 0) {
            const activeGoal = res.data.find((g) => g.isActive);
            setGoal(activeGoal || null);
          }
      } catch (err) {
        console.error("Error fetching active goal:", err);
      }
    };

    fetchGoal();
    
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

    if (!goal) return null;
  
    return (
      <div style={styles.banner}>
        <div style={styles.header}>
          <span style={styles.book}>📖 {goal.bookTitle}</span>
  
          {goal.meetingDate && (
            <span style={styles.meeting}>
              📅 {new Date(goal.meetingDate).toLocaleString()}
            </span>
          )}
        </div>
  
        <div style={styles.goal}>
          🎯 {goal.weeklyGoal}
        </div>
  
        {goal.lastMeetingNotes && (
          <div style={styles.notes}>
            📝 {goal.lastMeetingNotes}
          </div>
        )}
      </div>
    );
  }

/* ===========================
   STYLES (MATCH YOUR THEME)
=========================== */

const styles = {
  banner: {
    background: "#1a1a1a",
    border: "1px solid #2563eb",
    padding: "12px 16px",
    borderRadius: "12px",
    margin: "10px 20px",
    color: "#e0e0e0",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px"
  },

  book: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "15px"
  },

  meeting: {
    fontSize: "12px",
    color: "#888"
  },

  goal: {
    fontSize: "14px",
    lineHeight: "1.4"
  },

  notes: {
    fontSize: "12px",
    color: "#aaa",
    marginTop: "4px"
  }
};