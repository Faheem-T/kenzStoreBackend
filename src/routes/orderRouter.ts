import { Router } from "express";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";
import {
  cancelOrder,
  editOrder,
  editOrderStatus,
  getAllOrders,
  getAllUsersOrders,
  getOrder,
  placeOrder,
  verifyPayment,
} from "../controllers/orderController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

// v1/orders
export const orderRouter = Router()
  .post("/", userAccessMiddleware, placeOrder)
  .post("/verify", userAccessMiddleware, verifyPayment)
  // TODO: Implement retry payment
  .patch("/:orderId/cancel", userAccessMiddleware, cancelOrder)
  .get("/", userAccessMiddleware, getAllUsersOrders)
  .get("/admin", adminAccessMiddleware, getAllOrders) // Admin only
  .get("/:orderId", userAccessMiddleware, getOrder)
  .patch("/admin/:orderId", adminAccessMiddleware, editOrder) // Admin only
  .patch("/admin/:orderId/status", adminAccessMiddleware, editOrderStatus); // Admin only
