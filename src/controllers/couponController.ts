import { Coupon } from "../models/couponModel";
import { AdminRequestHandler } from "../types/authenticatedRequest";
import { CreateCouponType, UpdateCouponType } from "../types/coupon";

// POST v1/coupons
export const createCoupon: AdminRequestHandler<
  {},
  {},
  CreateCouponType
> = async (req, res, next) => {
  const {
    name,
    code,
    description,
    limitPerUser,
    validUntil,
    discountPercentage,
    minOrderAmount,
  } = req.body;

  try {
    const foundCoupons = await Coupon.find({ code });
    if (foundCoupons.length > 0) {
      res.status(400).json({
        success: false,
        message: "Coupon with the same code already exists!",
      });
      return;
    }

    await Coupon.create({
      name,
      code,
      discountPercentage,
      description,
      limitPerUser,
      validUntil,
      minOrderAmount,
    });

    res.status(200).json({
      success: true,
      message: "Coupon has been created",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE v1/coupons/:couponId
export const deleteCoupon: AdminRequestHandler<{ couponId: string }> = async (
  req,
  res,
  next
) => {
  const couponId = req.params.couponId;

  if (!couponId) {
    res.status(400).json({
      success: false,
      message: "'couponId' is required",
    });
    return;
  }
  try {
    const deletedCoupon = await Coupon.findByIdAndUpdate(couponId, {
      isDeleted: true,
    });
    if (!deletedCoupon) {
      res.status(400).json({
        success: false,
        message: "Couldn't delete coupon",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// GET v1/coupons
export const getAllCoupons: AdminRequestHandler = async (req, res, next) => {
  try {
    const foundCoupons = await Coupon.find({});
    if (!foundCoupons) {
      res.status(400).json({
        success: false,
        message: "Couldn't get coupons",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: foundCoupons,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH v1/coupons/:couponId
export const updateCoupon: AdminRequestHandler<
  { couponId: string },
  {},
  UpdateCouponType
> = async (req, res, next) => {
  const couponId = req.params.couponId;
  const patch = req.body;
  if (!couponId) {
    res.status(400).json({
      success: false,
      message: "'couponId' is required",
    });
    return;
  }

  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, patch, {
      new: true,
    });
    if (!updatedCoupon) {
      res.status(400).json({
        success: false,
        message: "Couldn't update coupon",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Coupon has been updated.",
    });
  } catch (error) {
    next(error);
  }
};
