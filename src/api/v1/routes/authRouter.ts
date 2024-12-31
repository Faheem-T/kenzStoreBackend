import { Router } from "express";
import { get_me, postLogin, postRegister } from "../handlers/authHandler";
import { validateRegisterMiddleware } from "../middlewares/validateRegisterMiddleware";

export const authRouter = Router()
  .get("/me", get_me)
  .get("/error", () => {
    throw new Error("Error only bro 😝");
  })
  .post("/register", validateRegisterMiddleware, postRegister)
.post("/login", postLogin)
