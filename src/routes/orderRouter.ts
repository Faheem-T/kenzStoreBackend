import { Router } from "express";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";
import { placeOrder } from "../controllers/orderController";

// v1/orders
export const orderRouter = Router().post("/", userAccessMiddleware, placeOrder);
