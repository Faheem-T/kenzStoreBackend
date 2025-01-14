import { Router } from "express";
import {
  getMe,
  getRefresh,
  postLogin,
  postRegister,
  postLogout,
  postVerifyOtp,
} from "../handlers/userAuthHandler";
import { validateRegisterMiddleware } from "../middlewares/validateRegisterMiddleware";

export const userAuthRouter = Router()
  .get("/me", getMe)
  .post("/register", validateRegisterMiddleware, postRegister)
  .post("/verify-otp", postVerifyOtp)
  .post("/login", postLogin)
  .get("/refresh", getRefresh)
  .post("/logout", postLogout);
