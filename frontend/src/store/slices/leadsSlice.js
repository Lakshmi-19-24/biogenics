import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { collection } from "../../services/api";
import { mapLeadFromApi, mapLeadToApi } from "../mappers";

export const fetchLeads = createAsyncThunk("leads/fetch", async () => {
  const response = await API.get("/leads?limit=100");
  return collection(response.raw).map(mapLeadFromApi);
});

export const saveLead = createAsyncThunk("leads/save", async ({ id, lead }) => {
  const payload = mapLeadToApi(lead);
  const response = id ? await API.patch(`/leads/${id}`, payload) : await API.post("/leads", payload);
  return mapLeadFromApi(response.data);
});

const leadsSlice = createSlice({
  name: "leads",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(saveLead.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index >= 0) state.items[index] = action.payload;
        else state.items.unshift(action.payload);
      });
  },
});

export default leadsSlice.reducer;
