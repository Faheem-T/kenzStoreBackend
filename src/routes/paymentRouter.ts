import { Router } from "express";
import { getRazorpayOrder } from "../controllers/paymentController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/payments
export const paymentRouter = Router().get(
  "/order",
  userAccessMiddleware,
  getRazorpayOrder
);
