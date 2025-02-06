import { Router } from "express";
import { getSalesReport } from "../../controllers/dashboardController";

// v1/admin/dashboard
export const adminDashboardRouter = Router().get(
  "/sales-report",
  getSalesReport
);
