import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── unchanged logic ── */
  const handleReset = async () => {
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`,
        { password }
      );

      setMessage("Password reset successful! Redirecting to login…");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ── handle Enter key ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleReset();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Icon badge */}
        <div className="auth-icon-badge" aria-hidden="true">🔒</div>

        {/* Title */}
        <h1 className="auth-title">Reset Password</h1>

        {/* Success view — replaces form */}
        {message ? (
          <>
            <div className="auth-success">{message}</div>
            <p className="auth-subtitle" style={{ marginBottom: 0 }}>
              You'll be redirected to the login page in a moment.
            </p>
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              Choose a strong new password for your account.
            </p>

            {/* Error banner */}
            {error && <div className="auth-error">{error}</div>}

            {/* New password input */}
            <input
              id="reset-password"
              className="auth-input"
              type="password"
              placeholder="New password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="New password"
            />

            {/* Confirm password input */}
            <input
              id="reset-confirm-password"
              className="auth-input"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Confirm new password"
            />

            {/* Submit button */}
            <button
              className="auth-button"
              onClick={handleReset}
              disabled={loading || !password.trim() || !confirm.trim()}
              aria-label="Reset password"
            >
              {loading ? "Resetting…" : "Reset Password"}
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