import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ── unchanged logic ── */
  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        { email }
      );

      setMessage(res.data.message || "If this email exists, a reset link has been sent.");
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ── handle Enter key ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Icon badge */}
        <div className="auth-icon-badge" aria-hidden="true">🔑</div>

        {/* Title */}
        <h1 className="auth-title">Forgot Password?</h1>

        {/* Subtitle — changes once email is sent */}
        {!message && (
          <p className="auth-subtitle">
            Enter the email address linked to your account and we'll send you a
            password reset link.
          </p>
        )}

        {/* ── Success view (replaces form) ── */}
        {message ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="auth-success" style={{ textAlign: "center" }}>{message}</div>
            
            {resetUrl ? (
              <a 
                href={resetUrl} 
                className="auth-button" 
                style={{ textDecoration: "none", textAlign: "center", display: "inline-block" }}
              >
                Reset Password Now
              </a>
            ) : (
              <p className="auth-subtitle" style={{ marginBottom: 0 }}>
                Check your inbox (and spam folder) for the reset link.
              </p>
            )}

            <span
              className="auth-back-link"
              onClick={() => navigate("/")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/")}
              aria-label="Back to login"
            >
              ← Back to Login
            </span>
          </div>
        ) : (
          <>
            {/* Error banner */}
            {error && <div className="auth-error">{error}</div>}

            {/* Email input */}
            <input
              id="forgot-email"
              className="auth-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Email address"
            />

            {/* Submit button */}
            <button
              className="auth-button"
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              aria-label="Send reset link"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            {/* Back to login */}
            <span
              className="auth-back-link"
              onClick={() => navigate("/")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/")}
              aria-label="Back to login"
            >
              ← Back to Login
            </span>
          </>
        )}

      </div>
    </div>
  );
}