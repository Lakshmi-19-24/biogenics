import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { collection } from "../../services/api";
import { mapLocationFromApi } from "../mappers";

export const fetchLatestLocations = createAsyncThunk("tracking/latest", async () => {
  const response = await API.get("/locations/latest");
  return collection(response.raw).map(mapLocationFromApi);
});

export const sendLocationPing = createAsyncThunk("tracking/ping", async (position) => {
  const response = await API.post("/locations", {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed || 0,
    source: "manual",
    trackedAt: new Date(position.timestamp || Date.now()).toISOString(),
  });
  return mapLocationFromApi(response.data);
});

const trackingSlice = createSlice({
  name: "tracking",
  initialState: { latest: [], ownPings: [], status: "idle", lastUpdated: null, error: null },
  reducers: {
    upsertLiveLocation(state, action) {
      const item = mapLocationFromApi(action.payload);
      const key = item.employee?._id || item.user || item.employeeName;
      const index = state.latest.findIndex((location) => (location.employee?._id || location.user || location.employeeName) === key);
      if (index >= 0) {
        const existing = state.latest[index];
        state.latest[index] = { ...existing, ...item, employee: item.employee || existing.employee };
      } else {
        state.latest.unshift(item);
      }
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLatestLocations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLatestLocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.latest = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchLatestLocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(sendLocationPing.fulfilled, (state, action) => {
        state.ownPings.unshift(action.payload);
      });
  },
});

export const { upsertLiveLocation } = trackingSlice.actions;
export default trackingSlice.reducer;
