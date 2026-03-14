import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  console.log("📤 [AXIOS REQUEST] Interceptor triggered:", {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenType: typeof token,
    tokenValue: token === "undefined" || token === "null" ? token : (token ? token.substring(0, 30) + "..." : "null"),
    isFormData: config.data instanceof FormData
  });

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ [AXIOS REQUEST] Authorization header set:", {
      headerExists: !!config.headers.Authorization,
      headerLength: config.headers.Authorization?.length || 0,
      headerPreview: config.headers.Authorization?.substring(0, 40) + "..."
    });
  } else {
    console.warn("⚠️ [AXIOS REQUEST] No valid token found in localStorage for request:", config.url);
    console.warn("⚠️ [AXIOS REQUEST] Token value:", token);
  }
  
  return config;
});

// Response interceptor for handling 401 errors (auto-refresh token)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token using cookie
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.accessToken;
        localStorage.setItem("token", newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token and redirect
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && !currentPath.startsWith("/dashboard")) {
          window.location.href = "/";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;