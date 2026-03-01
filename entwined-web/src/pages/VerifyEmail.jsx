import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`
        );
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/"), 3000);
      } catch (err) {
        setError(
          err.response?.data?.message || "Verification failed."
        );
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {error ? <h3>{error}</h3> : <h3>{message}</h3>}
    </div>
  );
}