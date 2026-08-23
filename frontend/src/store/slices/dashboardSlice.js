import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { collection } from "../../services/api";
import { mapOrderFromApi, titleCase } from "../mappers";

export const fetchDashboard = createAsyncThunk("dashboard/fetch", async () => {
  const [{ data: summary }, ordersRes, leadsRes] = await Promise.all([
    API.get("/analytics/dashboard"),
    API.get("/orders?limit=5"),
    API.get("/leads?limit=100"),
  ]);

  const orders = collection(ordersRes.raw).map(mapOrderFromApi);
  const leads = collection(leadsRes.raw);
  const leadCounts = leads.reduce((acc, lead) => {
    const stage = titleCase(lead.status || "new");
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  return {
    stats: {
      revenue: `Rs. ${Number(summary.orders?.salesValue || summary.payments?.received || 0).toLocaleString("en-IN")}`,
      orders: summary.orders?.total || 0,
      leads: summary.leads?.total || 0,
      teamSize: summary.users?.active || 0,
      products: summary.products?.total || 0,
      lowStock: summary.products?.lowStock || 0,
      visits: summary.visits?.total || 0,
      attendanceToday: summary.attendance?.today || 0,
    },
    revenue: [{ month: new Date().toLocaleString("en-IN", { month: "short" }), revenue: summary.orders?.salesValue || 0 }],
    leads: Object.entries(leadCounts).map(([stage, count]) => ({ stage, count })),
    recentOrders: orders,
  };
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { data: null, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default dashboardSlice.reducer;
