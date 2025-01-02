import { Router } from "express";
import {
  getMe,
  getRefresh,
  postLogin,
  postRegister,
  postLogout
} from "../handlers/authHandler";
import { validateRegisterMiddleware } from "../middlewares/validateRegisterMiddleware";

export const authRouter = Router()
  .get("/me", getMe)
  .post("/register", validateRegisterMiddleware, postRegister)
  .post("/login", postLogin)
  .get("/refresh", getRefresh)
  .post("/logout", postLogout)
