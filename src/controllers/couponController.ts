import { Coupon } from "../models/couponModel";
import { AdminRequestHandler } from "../types/authenticatedRequest";

// POST v1/coupons
interface CreateCouponBody {
  name: string;
  code: string;
  description?: string;
  limitPerUser: number;
  validUntil: string; // Date
}
export const createCoupon: AdminRequestHandler<
  {},
  {},
  CreateCouponBody
> = async (req, res, next) => {
  const { name, code, description, limitPerUser, validUntil } = req.body;

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
      description,
      limitPerUser,
      validUntil,
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
