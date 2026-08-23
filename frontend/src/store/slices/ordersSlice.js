import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { collection } from "../../services/api";
import { mapOrderFromApi } from "../mappers";

export const fetchOrders = createAsyncThunk("orders/fetch", async () => {
  const response = await API.get("/orders?limit=100");
  return collection(response.raw).map(mapOrderFromApi);
});

export const saveOrderStatus = createAsyncThunk("orders/status", async ({ id, status }) => {
  const apiStatus = {
    Pending: "draft",
    Confirmed: "approved",
    Shipped: "approved",
    Delivered: "fulfilled",
    Cancelled: "cancelled",
  }[status] || "placed";
  const response = await API.patch(`/orders/${id}/status`, { status: apiStatus });
  return mapOrderFromApi(response.data);
});

const ordersSlice = createSlice({
  name: "orders",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(saveOrderStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index >= 0) state.items[index] = action.payload;
      });
  },
});

export default ordersSlice.reducer;
