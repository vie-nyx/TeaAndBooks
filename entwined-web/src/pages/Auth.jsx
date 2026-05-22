import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import "../styles/Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const API = `${import.meta.env.VITE_API_URL}/api/auth`;

  /* ================= VALIDATIONS ================= */

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  /* ================= SIGNUP ================= */

  const handleSignup = async () => {
    setError("");
    setShowResend(false);

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/signup`,
        {
          username: username.trim(),
          email: email.trim(),
          password,
        },
        { withCredentials: true },
      );

      alert("Signup successful! Please verify your email.");

      setIsSignup(false);

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Signup failed.");
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

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/login`,
        {
          email: email.trim(),
          password,
        },
        { withCredentials: true },
      );

      if (!res.data.accessToken) {
        setError("Login failed: No token received");
        return;
      }

      await login(res.data.user, res.data.accessToken);

      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Login failed.";

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
        { withCredentials: true },
      );

      alert("Verification email sent.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend verification email.",
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
        { withCredentials: true },
      );

      const backendToken = res.data.accessToken || res.data.token;

      if (!backendToken) {
        setError("Google login failed: No token received from server");
        return;
      }

      await login(res.data.user, backendToken);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Google login failed.",
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

        {/* USERNAME */}

        {isSignup && (
          <div className="input-wrapper">
            <User size={18} className="input-icon" />

            <input
              className="auth-input"
              type="text"
              placeholder="Username"
              value={username}
              maxLength={20}
              onChange={(e) =>
                setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
              }
            />
          </div>
        )}

        {/* EMAIL */}

        <div className="input-wrapper">
          <Mail size={18} className="input-icon" />

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* PASSWORD */}

        <div className="input-wrapper">
          <Lock size={18} className="input-icon" />

          <input
            className="auth-input"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* CONFIRM PASSWORD */}

        {isSignup && (
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />

            <input
              className="auth-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              minLength={6}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {/* FORGOT PASSWORD */}

        {!isSignup && (
          <div
            className="forgot-password-link"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </div>
        )}

        {/* AUTH BUTTONS */}

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
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            )}
          </>
        )}

        {/* DIVIDER */}

        <div className="auth-divider">or continue with</div>

        {/* GOOGLE LOGIN */}

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        {/* SWITCH */}

        <div
          className="auth-switch"
          onClick={() => {
            setIsSignup(!isSignup);

            setError("");
            setShowResend(false);

            setPassword("");
            setConfirmPassword("");
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
