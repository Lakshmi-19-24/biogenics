import { Router } from "express";
import { salesDashboard } from "../controllers/salesDashboard.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { ROLES } from "../constants/roles.js";

export const salesDashboardRouter = Router();

salesDashboardRouter.use(
  authenticate,
  authorize(ROLES.SALES_EXECUTIVE)
);

salesDashboardRouter.get("/", salesDashboard);