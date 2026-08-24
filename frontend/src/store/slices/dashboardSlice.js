import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API, { collection } from "../../services/api";
import { mapOrderFromApi, titleCase } from "../mappers";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async () => {
    const [
      analyticsRes,
      ordersRes,
      leadsRes
    ] = await Promise.all([
      API.get("/analytics/dashboard"),
      API.get("/orders?limit=5"),
      API.get("/leads?limit=100")
    ]);

    const analytics = analyticsRes?.data || {};

    const orders = collection(ordersRes.raw).map(
      mapOrderFromApi
    );

    const leads = collection(leadsRes.raw);

    /*
     * ============================
     * LEAD PIPELINE
     * ============================
     */

    const leadCounts = leads.reduce((acc, lead) => {
      const stage = titleCase(
        lead.status || "new"
      );

      acc[stage] = (acc[stage] || 0) + 1;

      return acc;
    }, {});

    /*
     * ============================
     * OWNER / ADMIN ANALYTICS
     * ============================
     */

    const revenue =
      Number(
        analytics.orders?.salesValue ||
        analytics.payments?.received ||
        0
      );

    const totalOrders =
      Number(analytics.orders?.total || 0);

    const totalLeads =
      Number(analytics.leads?.total || 0);

    const teamSize =
      Number(analytics.users?.active || 0);

    const totalProducts =
      Number(analytics.products?.total || 0);

    const lowStock =
      Number(analytics.products?.lowStock || 0);

    const visits =
      Number(analytics.visits?.total || 0);

    const attendanceToday =
      Number(analytics.attendance?.today || 0);

    /*
     * ============================
     * FINAL DATA
     * ============================
     */

    return {
      stats: {

        /*
         * Owner Dashboard
         */

        revenue:
          `₹${revenue.toLocaleString("en-IN")}`,

        orders:
          totalOrders,

        leads:
          totalLeads,

        teamSize:
          teamSize,

        products:
          totalProducts,

        lowStock:
          lowStock,

        visits:
          visits,

        attendanceToday:
          attendanceToday,

        /*
         * Sales Dashboard
         */

        myLeads:
          totalLeads,

        myOrders:
          totalOrders,

        todayVisits:
          visits,

        /*
         * Pending tasks
         *
         * These are supplied by the
         * Sales Dashboard API when available.
         */

        pendingTasks: {
          newLeads:
            analytics.pendingTasks?.newLeads || 0,

          followUps:
            analytics.pendingTasks?.followUps || 0,

          orders:
            analytics.pendingTasks?.orders || 0,

          reminders:
            analytics.pendingTasks?.reminders || 0,

          dailyReport:
            analytics.pendingTasks?.dailyReport || false,

          dailyReportStatus:
            analytics.pendingTasks?.dailyReportStatus ||
            "pending"
        },

        dcrStatus:
          analytics.pendingTasks?.dailyReportStatus ||
          "pending"
      },

      /*
       * ============================
       * LEAD CHART
       * ============================
       */

      leads:
        Object.entries(leadCounts).map(
          ([stage, count]) => ({
            stage,
            count
          })
        ),

      /*
       * ============================
       * REVENUE CHART
       * ============================
       *
       * Current backend only returns
       * total revenue, so we show it
       * for the current month.
       */

      revenue: [
        {
          month: new Date().toLocaleString(
            "en-IN",
            {
              month: "short"
            }
          ),
          revenue
        }
      ],

      /*
       * ============================
       * RECENT ORDERS
       * ============================
       */

      recentOrders: orders
    };
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",

  initialState: {
    data: null,
    status: "idle",
    error: null
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(
        fetchDashboard.pending,
        (state) => {
          state.status = "loading";
          state.error = null;
        }
      )

      .addCase(
        fetchDashboard.fulfilled,
        (state, action) => {
          state.status = "succeeded";
          state.data = action.payload;
          state.error = null;
        }
      )

      .addCase(
        fetchDashboard.rejected,
        (state, action) => {
          state.status = "failed";
          state.error =
            action.error?.message ||
            "Failed to load dashboard";
        }
      );
  }
});

export default dashboardSlice.reducer;