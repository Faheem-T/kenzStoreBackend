import { Router } from "express";
import { authRouter } from "./authRouter";

export const rootRouter = Router().use("/auth", authRouter);
