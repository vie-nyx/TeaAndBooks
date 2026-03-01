import React, { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        { email }
      );

      setMessage("If this email exists, a reset link has been sent.");
    } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Something went wrong";
      
        setError(errorMessage);
      }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Forgot Password</h2>
      <input
        placeholder="Enter your email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />
      <button onClick={handleSubmit}>Send Reset Link</button>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}