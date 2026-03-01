import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();
  const API = `${import.meta.env.VITE_API_URL}/api/auth`;

  /* ================= SIGNUP ================= */

  const handleSignup = async () => {
    setError("");
    setShowResend(false);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/signup`,
        { username, email, password },
        { withCredentials: true }
      );

      alert("Signup successful! Please verify your email.");
      setIsSignup(false);
      setUsername("");
      setPassword("");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Signup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGIN ================= */

  const handleLogin = async () => {
    setError("");
    setShowResend(false);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/login`,
        { email, password },
        { withCredentials: true }
      );

      await login(res.data.user, res.data.accessToken);
      navigate("/dashboard");

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed.";

      setError(message);

      if (message.toLowerCase().includes("verify")) {
        setShowResend(true);
      }

    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND VERIFICATION ================= */

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setResendLoading(true);

    try {
      await axios.post(
        `${API}/resend-verification`,
        { email },
        { withCredentials: true }
      );

      alert("Verification email sent.");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to resend verification email."
      );
    } finally {
      setResendLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );

      await login(res.data.user, res.data.accessToken);
      navigate("/dashboard");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Google login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-title">
          {isSignup ? "Create Account" : "Welcome Back"}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {isSignup && (
          <input
            className="auth-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isSignup && (
          <div
            className="forgot-password-link"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </div>
        )}

        {isSignup ? (
          <button
            className="auth-button"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        ) : (
          <>
            <button
              className="auth-button"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {showResend && (
              <button
                className="resend-button"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading
                  ? "Sending..."
                  : "Resend Verification Email"}
              </button>
            )}
          </>
        )}

        <div className="auth-divider">or continue with</div>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google login failed")}
        />

        <div
          className="auth-switch"
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
            setShowResend(false);
          }}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </div>

      </div>
    </div>
  );
}