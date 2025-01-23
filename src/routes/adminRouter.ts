import { Router } from "express";
import { adminAuthRouter } from "./adminRoutes/adminAuthRouter";
import { userManagementRouter } from "./adminRoutes/userManagementRouter";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

// v1/admin
export const adminRouter = Router()
  .use("/auth", adminAuthRouter)
  .use("/users", adminAccessMiddleware, userManagementRouter);
