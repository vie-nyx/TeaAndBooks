import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { validateEmail, validatePassword, validateUsername } from "../utils/validation";
import "../styles/Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();
  const API = `${import.meta.env.VITE_API_URL}/api/auth`;

  /* ================= FIELD VALIDATION ================= */

  const validateSignupForm = () => {
    const errors = {};
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLoginForm = () => {
    const errors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    if (!password.trim()) {
      errors.password = "Password is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    // Clear the error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  /* ================= SIGNUP ================= */

  const handleSignup = async () => {
    setError("");
    setShowResend(false);

    if (!validateSignupForm()) {
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

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 [LOGIN] Sending login request...");
      const res = await axios.post(
        `${API}/login`,
        { email, password },
        { withCredentials: true }
      );

      console.log("✅ [LOGIN] Login response received:", {
        hasUser: !!res.data.user,
        hasAccessToken: !!res.data.accessToken,
        accessTokenLength: res.data.accessToken?.length || 0,
        accessTokenPreview: res.data.accessToken?.substring(0, 20) + "..."
      });

      if (!res.data.accessToken) {
        console.error("❌ [LOGIN] No accessToken in response!");
        setError("Login failed: No token received");
        return;
      }

      console.log("💾 [LOGIN] Storing token in localStorage...");
      await login(res.data.user, res.data.accessToken);
      
      // Verify token was stored
      const storedToken = localStorage.getItem("token");
      console.log("✅ [LOGIN] Token stored:", {
        exists: !!storedToken,
        length: storedToken?.length || 0,
        matches: storedToken === res.data.accessToken
      });

      navigate("/dashboard");

    } catch (err) {
      console.error("❌ [LOGIN] Login error:", err);
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
      console.log("🔐 [GOOGLE LOGIN] Sending Google login request...");
      const res = await axios.post(
        `${API}/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );

      const backendToken = res.data.accessToken || res.data.token;

      console.log("✅ [GOOGLE LOGIN] Login response received:", {
        hasUser: !!res.data.user,
        hasAccessToken: !!res.data.accessToken,
        hasFallbackToken: !!res.data.token,
        tokenLength: backendToken?.length || 0,
      });

      if (!backendToken) {
        console.error("❌ [GOOGLE LOGIN] No token in response!", res.data);
        setError("Google login failed: No token received from server");
        return;
      }

      console.log("💾 [GOOGLE LOGIN] Storing token in localStorage...");
      await login(res.data.user, backendToken);
      
      const storedToken = localStorage.getItem("token");
      console.log("✅ [GOOGLE LOGIN] Token stored:", {
        exists: !!storedToken,
        length: storedToken?.length || 0
      });

      navigate("/dashboard");

    } catch (err) {
      console.error("❌ [GOOGLE LOGIN] Login error:", err);
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
          <div className="form-field">
            <input
              className={`auth-input ${fieldErrors.username ? 'input-error' : ''}`}
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleFieldChange('username', e.target.value);
              }}
            />
            {fieldErrors.username && (
              <div className="field-error-message">
                <span className="error-icon">⚠️</span> {fieldErrors.username}
              </div>
            )}
          </div>
        )}

        <div className="form-field">
          <input
            className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              handleFieldChange('email', e.target.value);
            }}
          />
          {fieldErrors.email && (
            <div className="field-error-message">
              <span className="error-icon">⚠️</span> {fieldErrors.email}
            </div>
          )}
        </div>

        <div className="form-field">
          <input
            className={`auth-input ${fieldErrors.password ? 'input-error' : ''}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              handleFieldChange('password', e.target.value);
            }}
          />
          {fieldErrors.password && (
            <div className="field-error-message">
              <span className="error-icon">⚠️</span> {fieldErrors.password}
            </div>
          )}
          {isSignup && !fieldErrors.password && password && (
            <div className="field-success-message">
              <span className="success-icon">✓</span> Password meets requirements
            </div>
          )}
        </div>

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

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        <div
          className="auth-switch"
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
            setFieldErrors({});
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