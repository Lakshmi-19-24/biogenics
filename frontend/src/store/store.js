import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import leadsReducer from "./slices/leadsSlice";
import ordersReducer from "./slices/ordersSlice";
import attendanceReducer from "./slices/attendanceSlice";
import trackingReducer from "./slices/trackingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    leads: leadsReducer,
    orders: ordersReducer,
    attendance: attendanceReducer,
    tracking: trackingReducer,
  },
});
