import { Router } from "express";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";
import {
  approveOrderReturn,
  cancelOrder,
  editOrder,
  editOrderStatus,
  getAllOrders,
  getAllUsersOrders,
  getOrder,
  placeOrder,
  rejectOrderReturn,
  requestOrderReturn,
  retryPayment,
  verifyPayment,
} from "../controllers/orderController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";
import { generalAccessMiddleware } from "../middlewares/generalAccessMiddleware";

// v1/orders
export const orderRouter = Router()
  .post("/", userAccessMiddleware, placeOrder)
  .post("/verify", userAccessMiddleware, verifyPayment)
  .patch("/:orderId/retry-payment", userAccessMiddleware, retryPayment)
  // TODO: Implement retry payment
  .patch("/:orderId/cancel", userAccessMiddleware, cancelOrder)
  .patch("/:orderId/return", userAccessMiddleware, requestOrderReturn)
  .patch(
    "/admin/:orderId/return/approve",
    adminAccessMiddleware,
    approveOrderReturn
  ) // Admin only
  .patch(
    "/admin/:orderId/return/reject",
    adminAccessMiddleware,
    rejectOrderReturn
  ) // Admin only
  .get("/", userAccessMiddleware, getAllUsersOrders)
  .get("/admin", adminAccessMiddleware, getAllOrders) // Admin only
  .get("/:orderId", generalAccessMiddleware, getOrder)
  .patch("/admin/:orderId", adminAccessMiddleware, editOrder) // Admin only
  .patch("/admin/:orderId/status", adminAccessMiddleware, editOrderStatus); // Admin only
