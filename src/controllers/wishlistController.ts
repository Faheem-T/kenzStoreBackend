import mongoose from "mongoose";
import { Wishlist } from "../models/wishlistModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const getWishlist: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(400).json({
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
      res.status(400).json({
        success: false,
        message: "Couldn't find wishlist",
      });
      return;
    }

    res.status(200).json({
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
    res.status(400).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  if (!productId) {
    res.status(400).json({
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
      res.status(400).json({
        success: false,
        message: "Error while adding to wishlist",
      });
      return;
    }

    res.status(200).json({
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
    res.status(401).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  if (!productId) {
    res.status(400).json({
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

    res.status(200).json({
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
    res.status(401).json({
      success: false,
      message: "Authenticated users only",
    });
    return;
  }

  try {
    await Wishlist.findOneAndUpdate({ user: userId }, { products: [] });

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
