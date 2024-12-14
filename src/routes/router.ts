import { Router } from "express";
import { authRouter } from "./authRoute";

export const rootRouter = Router().use("/auth", authRouter);
