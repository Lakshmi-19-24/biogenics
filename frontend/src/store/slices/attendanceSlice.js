import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { apiErrorMessage, collection } from "../../services/api";
import { mapAttendanceSessionsFromApi } from "../mappers";

const getPositionPayload = (position) => ({
  latitude: Number(position?.coords?.latitude ?? 0),
  longitude: Number(position?.coords?.longitude ?? 0),
  accuracy: position?.coords?.accuracy,
});

export const fetchAttendance = createAsyncThunk("attendance/fetch", async () => {
  const response = await API.get("/attendance?limit=100&mine=true");
  return collection(response.raw).flatMap(mapAttendanceSessionsFromApi);
});

export const checkInAttendance = createAsyncThunk("attendance/checkIn", async (position, { rejectWithValue }) => {
  try {
    const payload = getPositionPayload(position);
    console.debug("Attendance check-in payload:", payload);
    const response = await API.post("/attendance/check-in", payload);
    return mapAttendanceSessionsFromApi(response.data);
  } catch (error) {
    console.error("Check-in error:", error.response?.data || error);
    return rejectWithValue(apiErrorMessage(error, "Unable to check in"));
  }
});

export const checkOutAttendance = createAsyncThunk("attendance/checkOut", async (position, { rejectWithValue }) => {
  try {
    const payload = getPositionPayload(position);
    const response = await API.post("/attendance/check-out", payload);
    return mapAttendanceSessionsFromApi(response.data);
  } catch (error) {
    console.error("Check-out error:", error.response?.data || error);
    return rejectWithValue(apiErrorMessage(error, "Unable to check out"));
  }
});

const todayKey = () => new Date().toLocaleDateString("en-CA");

const getActiveSession = (items = []) =>
  items.find((item) => item.date === todayKey() && item.checkInAt && !item.checkOutAt) || null;

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: { items: [], activeSession: null, status: "idle", actionStatus: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.activeSession = getActiveSession(state.items);
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addMatcher(
        (action) => [checkInAttendance.pending.type, checkOutAttendance.pending.type].includes(action.type),
        (state) => {
          state.actionStatus = "loading";
        }
      )
      .addMatcher(
        (action) => [checkInAttendance.fulfilled.type, checkOutAttendance.fulfilled.type].includes(action.type),
        (state, action) => {
          state.actionStatus = "succeeded";
          const rows = action.payload;
          const parentId = rows[0]?.parentId;
          state.items = parentId
            ? [...rows, ...state.items.filter((item) => item.parentId !== parentId)]
            : [...rows, ...state.items];
          state.activeSession = getActiveSession(state.items);
        }
      )
      .addMatcher(
        (action) => [checkInAttendance.rejected.type, checkOutAttendance.rejected.type].includes(action.type),
        (state, action) => {
          state.actionStatus = "failed";
          state.error = action.error.message;
        }
      );
  },
});

export default attendanceSlice.reducer;
