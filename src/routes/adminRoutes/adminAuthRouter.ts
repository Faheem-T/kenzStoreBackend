import { Router } from "express";
import {
  getAdminRefresh,
  postAdminLogin,
  postCreateAdmin,
} from "../../controllers/adminAuthController";

export const adminAuthRouter = Router()
  .post("/", postCreateAdmin)
  .post("/login", postAdminLogin)
  .get("/refresh", getAdminRefresh);
