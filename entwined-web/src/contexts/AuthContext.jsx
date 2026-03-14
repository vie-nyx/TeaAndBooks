import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyAndFetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token with backend and fetch user data
  const verifyAndFetchUser = async () => {
    try {
      const response = await api.get("/api/auth/verify");
      
      if (response.data.valid && response.data.user) {
        setUser(response.data.user);
      } else {
        // Token is invalid
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      // Only remove token if it's a 401 (unauthorized), not network errors
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        // Network error or server error - keep token, might be temporary
        console.error("Error verifying token (might be network issue):", error);
        // Try to decode token locally as fallback
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUser({ _id: payload.id });
          }
        } catch (e) {
          // Token is malformed, remove it
          localStorage.removeItem("token");
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    console.log("🔑 [AUTH CONTEXT] login() called with:", {
      hasUserData: !!userData,
      hasToken: !!token,
      tokenType: typeof token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 30) + "..." : "null"
    });

    if (!token) {
      console.error("❌ [AUTH CONTEXT] No token provided to login()!");
      return;
    }

    console.log("💾 [AUTH CONTEXT] Setting token in localStorage...");
    localStorage.setItem("token", token);
    
    // Verify it was stored
    const verifyStored = localStorage.getItem("token");
    console.log("✅ [AUTH CONTEXT] Token storage verified:", {
      stored: !!verifyStored,
      matches: verifyStored === token,
      length: verifyStored?.length || 0
    });

    // Set user immediately for faster UI update
    setUser(userData);
    
    // Verify token in background and update user if needed
    try {
      const response = await api.get("/api/auth/verify");
      if (response.data.valid && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      // If verification fails, keep the userData that was set
      console.error("Token verification failed:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyAndFetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

