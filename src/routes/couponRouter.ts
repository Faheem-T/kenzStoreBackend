import { Router } from "express";
import {
  applyCouponToCart,
  createCoupon,
  deleteCoupon,
  deleteCouponFromCart,
  getAllCoupons,
  getApplicableCoupons,
  updateCoupon,
} from "../controllers/couponController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/coupons
export const couponRouter = Router()
  .delete("/cart", userAccessMiddleware, deleteCouponFromCart)
  .get("/users/applicable", userAccessMiddleware, getApplicableCoupons)
  .get("/", adminAccessMiddleware, getAllCoupons)
  .post("/", adminAccessMiddleware, createCoupon)
  .post("/cart", userAccessMiddleware, applyCouponToCart)
  .delete("/:couponId", adminAccessMiddleware, deleteCoupon)
  .patch("/:couponId", adminAccessMiddleware, updateCoupon);
