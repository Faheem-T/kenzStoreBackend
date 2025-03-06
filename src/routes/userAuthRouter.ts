import { Router } from "express";
import {
  getMe,
  getRefresh,
  postLogin,
  postRegister,
  postLogout,
  postVerifyOtp,
  postResendOtp,
  postForgotPassword,
  postResetPassword,
  googleLogin,
} from "../controllers/userAuthController";
import { validateRegisterMiddleware } from "../middlewares/validateRegisterMiddleware";

export const userAuthRouter = Router()
  .get("/me", getMe)
  .post("/register", validateRegisterMiddleware, postRegister)
  .post("/verify-otp", postVerifyOtp)
  .post("/resend-otp", postResendOtp)
  .post("/login", postLogin)
  .get("/refresh", getRefresh)
  .post("/logout", postLogout)
  .post("/forgot-password", postForgotPassword)
  .post("/reset-password", postResetPassword)
  .post("/google-login", googleLogin);
