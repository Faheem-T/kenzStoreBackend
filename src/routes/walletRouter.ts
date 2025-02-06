import { Router } from "express";
import { getUserWallet } from "../controllers/walletController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// /v1/wallets
export const walletRouter = Router().get(
  "/",
  userAccessMiddleware,
  getUserWallet
);
