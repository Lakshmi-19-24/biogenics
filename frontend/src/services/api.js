import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const API = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken = null;
let authHandlers = {};
const authChannel = "BroadcastChannel" in window ? new BroadcastChannel("bio-genics-auth") : null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

export const setAuthHandlers = (handlers = {}) => {
  authHandlers = handlers;
};

export const getStoredAuth = () => {
  const user = localStorage.getItem("user");
  return {
    token: null,
    refreshToken: null,
    user: user ? JSON.parse(user) : null,
  };
};

export const setStoredAuth = ({ user }) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", user.role);
    localStorage.setItem("userName", user.name || "User");
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
};

export const unwrap = (payload) => payload?.data ?? payload;

export const collection = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

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
  
  isRefreshing = false;
  failedQueue = [];
};

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    response.raw = response.data;
    const data = unwrap(response.data);
    response.data = Array.isArray(data?.items) ? data.items : data;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/refresh-token") || url.includes("/auth/logout");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute && !originalRequest?.skipAuthRefresh) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken, token } = response.data.data;
        const newToken = accessToken || token;
        
        if (newToken) {
          setAccessToken(newToken);
          setStoredAuth({ user: response.data.data.user });
          authHandlers.onTokenRefreshed?.({ accessToken: newToken, user: response.data.data.user });
          authChannel?.postMessage({ type: "token-refreshed" });
          API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return API(originalRequest);
        } else {
          throw new Error("No token in refresh response");
        }
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);
        clearStoredAuth();
        authHandlers.onUnauthorized?.();
        authChannel?.postMessage({ type: "logout" });
        if (window.location.pathname !== "/") window.location.href = "/";
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      setAccessToken(null);
      clearStoredAuth();
      authHandlers.onUnauthorized?.();
      authChannel?.postMessage({ type: "logout" });
      if (window.location.pathname !== "/") window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

authChannel?.addEventListener("message", (event) => {
  if (event.data?.type === "logout") {
    setAccessToken(null);
    clearStoredAuth();
    authHandlers.onUnauthorized?.();
  }
  if (event.data?.type === "token-refreshed") {
    authHandlers.onSessionRefreshRequested?.();
  }
});

export const apiErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export const apiData = (response) => response?.data?.data ?? response?.data ?? null;

export const apiItems = (response) => {
  const data = apiData(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default API;
