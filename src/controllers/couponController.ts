import mongoose from "mongoose";
import { Cart } from "../models/cartModel";
import { Coupon } from "../models/couponModel";
import {
  AdminRequestHandler,
  UserRequestHandler,
} from "../types/authenticatedRequest";
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
    discountValue: discountPercentage,
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
      discountValue: discountPercentage,
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

// GET v1/coupons/users/applicable
export const getApplicableCoupons: UserRequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.userId as string;
  try {
    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      res.status(400).json({
        success: false,
        message: "Couldn't find cart",
      });
      return;
    }
    if (userCart.discountValue !== 0) {
      res.status(200).json({
        success: true,
        data: [],
        message: "A coupon is already applied",
      });
      return;
    }
    let applicableCoupons = await Coupon.find(
      {
        minOrderAmount: { $lte: userCart.cartTotal },
        isDeleted: { $ne: true },
        validUntil: { $not: { $lt: new Date() } },
      },
      {
        name: 1,
        code: 1,
        description: 1,
        discountValue: 1,
        validUntil: 1,
        minOrderAmount: 1,
        redeemedUsers: 1,
        limitPerUser: 1,
      }
    ).lean();
    console.log(applicableCoupons);
    applicableCoupons = applicableCoupons.filter((coupon) => {
      // if (!coupon.redeemedUsers)
      const userUsedCount =
        coupon.redeemedUsers.filter((id) => userId === id.toString()).length ??
        0;
      return userUsedCount < coupon.limitPerUser;
    });
    res.status(200).json({
      success: true,
      data: applicableCoupons,
    });
  } catch (error) {
    next(error);
  }
};

export const applyCouponToCart: UserRequestHandler<
  {},
  any,
  { code: string }
> = async (req, res, next) => {
  const userId = req.userId as string;
  const code = req.body.code;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(400).json({
        success: false,
        message: "Cart not found!",
      });
      return;
    }

    const coupon = await Coupon.findOne({
      code,
      minOrderAmount: { $lte: cart.cartTotal },
      isDeleted: { $ne: true },
      validUntil: { $not: { $lt: new Date() } },
    });

    if (!coupon) {
      res.status(400).json({
        success: false,
        message: "Couldn't find a valid coupon with that code",
      });
      return;
    }

    // checking if limit has been reached
    const userUsedCount = coupon.redeemedUsers.filter(
      (id) => String(id) === userId
    ).length;
    if (userUsedCount >= coupon.limitPerUser) {
      res.status(400).json({
        success: false,
        message: "Limit has been reached",
      });
      return;
    }

    // update cart discount
    cart.coupon = coupon._id;
    cart.discountType = coupon.discountType;
    cart.discountValue = coupon.discountValue;
    await cart.save();

    // update coupon
    coupon.totalUsedCount += 1;
    coupon.redeemedUsers.push(new mongoose.Types.ObjectId(userId));
    await coupon.save();
    res.status(200).json({
      success: true,
      message: "Coupon has bee applied successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCouponFromCart: UserRequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.userId as string;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(400).json({
        success: false,
        message: "Couldn't find cart",
      });
      return;
    }

    const coupon = await Coupon.findById(cart.coupon);
    if (!coupon) {
      res.status(400).json({
        success: false,
        message: "Couldn't find applied coupon",
      });
      return;
    }

    // revert changes made to coupon
    coupon.totalUsedCount -= 1;
    const index = coupon.redeemedUsers.indexOf(
      new mongoose.Types.ObjectId(userId)
    );
    coupon.redeemedUsers.splice(index, 1);
    coupon.save();

    // discard coupon related data from cart
    cart.coupon = null;
    cart.discountType = null;
    cart.discountValue = 0;
    await cart.save();
    res.status(200).json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
