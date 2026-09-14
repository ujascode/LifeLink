import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// Add request token interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("lifelink_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Add response interceptor for retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry on 4xx errors (client errors) except 408 (timeout) and 429 (rate limit)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      // Don't retry on 400, 401, 403, 404, etc. but allow 408 and 429
      if (error.response.status !== 408 && error.response.status !== 429) {
        return Promise.reject(error);
      }
    }

    // Don't retry if it's already been retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Only retry for network errors, timeouts, or 5xx errors
    if (!error.response ||
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENETWORK" ||
        error.response?.status >= 500) {

      // Retry up to 3 times with exponential backoff
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 3) {
        originalRequest._retryCount = retryCount + 1;
        originalRequest._retry = true;

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(originalRequest));
          }, delay);
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
