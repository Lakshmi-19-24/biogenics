import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { clearStoredAuth, getStoredAuth, setAccessToken, setStoredAuth } from "../../services/api";

const stored = getStoredAuth();

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await API.post("/auth/login", credentials);
    setAccessToken(data.accessToken || data.token);
    setStoredAuth(data);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Invalid email or password");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await API.post("/auth/logout", {}, { skipAuthRefresh: true });
  } finally {
    setAccessToken(null);
    clearStoredAuth();
  }
});

export const refreshToken = createAsyncThunk("auth/refresh", async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.post("/auth/refresh-token", {}, { skipAuthRefresh: true });
    setAccessToken(data.accessToken || data.token);
    setStoredAuth(data);
    return data;
  } catch (error) {
    setAccessToken(null);
    clearStoredAuth();
    return rejectWithValue(error.response?.data?.message || "Token refresh failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: stored.token,
    user: stored.user,
    status: "idle",
    error: null,
  },
  reducers: {
    setAuth(state, action) {
      setStoredAuth(action.payload);
      state.token = action.payload.accessToken || action.payload.token;
      state.user = action.payload.user;
      state.status = "succeeded";
    },
    restoreAuth(state) {
      const current = getStoredAuth();
      state.token = current.token;
      state.user = current.user;
    },
    logoutLocal(state) {
      setAccessToken(null);
      clearStoredAuth();
      state.token = null;
      state.user = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.accessToken || action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = "idle";
      })
      // Refresh Token
      .addCase(refreshToken.pending, (_state) => {
        // Keep existing state during refresh
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken || action.payload.token;
        state.user = action.payload.user;
        state.status = "succeeded";
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.token = null;
        state.user = null;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logoutLocal, restoreAuth, setAuth } = authSlice.actions;
export default authSlice.reducer;
