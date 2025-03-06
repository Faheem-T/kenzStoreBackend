import { HttpStatus } from "../utils/httpenum";
import mongoose from "mongoose";
import { Wishlist } from "../models/wishlistModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const getWishlist: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  try {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products",
      populate: "category",
    });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }
    if (!wishlist) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Couldn't find wishlist",
      });
      return;
    }

    res.status(HttpStatus.OK).json({
      success: true,
      data: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist: UserRequestHandler<
  {},
  any,
  { productId: string }
> = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.body.productId;
  if (!userId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  if (!productId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "'productId' is required",
    });
    return;
  }

  try {
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $push: { products: productId } },
      {
        upsert: true,
        new: true,
      }
    );
    if (!updatedWishlist) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Error while adding to wishlist",
      });
      return;
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Added to wishlist successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist: UserRequestHandler<
  {},
  any,
  { productId: string }
> = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.body.productId;
  if (!userId) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  if (!productId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "'productId' is required",
    });
    return;
  }

  try {
    await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: productId } }
    );

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const clearWishlist: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  try {
    await Wishlist.findOneAndUpdate({ user: userId }, { products: [] });

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
