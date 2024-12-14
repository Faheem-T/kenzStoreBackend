import { Router } from "express";
import { get_me } from "../handlers/authHandler";

export const authRouter = Router()
  .get("/me", get_me)
  .get("/error", () => {
    throw new Error("Error only bro 😝");
  });
