import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutLocal, logoutUser, refreshToken, setAuth } from "../store/slices/authSlice";
import { initSocket, disconnectSocket, updateSocketAuth } from "../services/socket";
import { startAutoLocationTracking, stopAutoLocationTracking } from "../services/locationTracking";
import { fetchAttendance } from "../store/slices/attendanceSlice";
import { setAuthHandlers } from "../services/api";

const AuthContext = createContext(null);

const normalizeRole = (role) => (role === "sales_executive" ? "sales" : role);

function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, token, status } = useSelector((state) => state.auth);
  const activeSession = useSelector((state) => state.attendance.activeSession);
  const normalizedUser = user ? { ...user, role: normalizeRole(user.role), token } : null;
  const refreshIntervalRef = useRef(null);
  const [initializing, setInitializing] = useState(true);

  const refreshTokenProactively = useCallback(async () => {
    dispatch(refreshToken());
  }, [dispatch]);

  useEffect(() => {
    setAuthHandlers({
      onTokenRefreshed: (data) => dispatch(setAuth(data)),
      onUnauthorized: () => dispatch(logoutLocal()),
      onSessionRefreshRequested: () => dispatch(refreshToken()),
    });

    dispatch(refreshToken()).finally(() => setInitializing(false));

    return () => setAuthHandlers({});
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      // Initialize Socket.io connection and keep auth fresh across token refreshes
      initSocket(token);
      updateSocketAuth(token);

      // Hydrate today's attendance state so tracking resumes if already checked in
      if (normalizedUser?.role === "sales") {
        dispatch(fetchAttendance()).catch(() => {});
      }

      refreshIntervalRef.current = setInterval(refreshTokenProactively, 12 * 60 * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      stopAutoLocationTracking();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [token, user, normalizedUser?.role, refreshTokenProactively, dispatch]);

  // Track only between check-in and check-out for sales representatives
  useEffect(() => {
    if (normalizedUser?.role !== "sales") return undefined;
    if (activeSession) {
      startAutoLocationTracking(true);
    } else {
      stopAutoLocationTracking();
    }
    return () => {
      stopAutoLocationTracking();
    };
  }, [normalizedUser?.role, activeSession]);

  // Update: wrap login and logout with useCallback and memoize provider value
  const login = useCallback((data) => {
    if (data) {
      dispatch(setAuth(data));
      // Socket.io will be initialized in the useEffect
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    stopAutoLocationTracking();
    disconnectSocket();
    dispatch(logoutUser());
  }, [dispatch]);

  // Memoize the context value to avoid re‑creating the object on every render
  const contextValue = useMemo(() => ({
    user: normalizedUser,
    rawUser: user,
    token,
    isAuthenticated: Boolean(token && user),
    loading: initializing || (status === "loading" && !user),
    login,
    logout,
  }), [normalizedUser, user, token, status, initializing, login, logout]);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export { AuthProvider };
export default AuthProvider;
