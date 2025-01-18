import { Router } from "express";
import { userProfileRouter } from "./userProfileRouter";

// v1/users
export const userRouter = Router().use("/", userProfileRouter);
