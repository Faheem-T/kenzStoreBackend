import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  updateCoupon,
} from "../controllers/couponController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

// v1/coupons
export const couponRouter = Router()
  .get("/", adminAccessMiddleware, getAllCoupons)
  .post("/", adminAccessMiddleware, createCoupon)
  .delete("/:couponId", adminAccessMiddleware, deleteCoupon)
  .patch("/:couponId", adminAccessMiddleware, updateCoupon);
