import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  getApplicableCoupons,
  updateCoupon,
} from "../controllers/couponController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/coupons
export const couponRouter = Router()
  .get("/", adminAccessMiddleware, getAllCoupons)
  .post("/", adminAccessMiddleware, createCoupon)
  .delete("/:couponId", adminAccessMiddleware, deleteCoupon)
  .patch("/:couponId", adminAccessMiddleware, updateCoupon)
  .get("/users/applicable", userAccessMiddleware, getApplicableCoupons);
