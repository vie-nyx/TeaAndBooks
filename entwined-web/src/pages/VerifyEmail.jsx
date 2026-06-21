import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams(); // route is /verify-email/:token
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`
        );
        setStatus("success");
        setMessage(res.data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {status === "verifying" && (
          <>
            <div style={styles.spinner}></div>
            <p style={styles.text}>Verifying your email, please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={styles.icon}>✅</div>
            <h2 style={styles.heading}>Email Verified!</h2>
            <p style={styles.text}>{message}</p>
            <button style={styles.button} onClick={() => navigate("/")}>
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={styles.icon}>❌</div>
            <h2 style={styles.heading}>Verification Failed</h2>
            <p style={styles.text}>{message}</p>
            <button style={styles.button} onClick={() => navigate("/")}>
              Back to Login
            </button>
          </>
        )}

      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fdf6ec",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "48px 40px",
    maxWidth: "420px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  icon: { fontSize: "52px", marginBottom: "16px" },
  heading: { fontSize: "22px", color: "#3b2212", marginBottom: "8px" },
  text: { color: "#666", lineHeight: 1.6, marginBottom: "24px" },
  button: {
    padding: "10px 28px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #eee",
    borderTop: "4px solid #6c63ff",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 0.8s linear infinite",
  },
};