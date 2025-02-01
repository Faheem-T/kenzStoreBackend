import { RequestHandler } from "express";
import { Review } from "../models/reviewModel";
import { postProductReviewBodyType } from "../types/requestBodyTypes";
import { Product } from "../models/productModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const getReview: RequestHandler<{ id: string }> = async (
  req,
  res,
  next
) => {
  const reviewId = req.params.id;
  try {
    const foundReview = await Review.findById(reviewId);
    res.status(200).json({
      success: true,
      data: foundReview,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews: UserRequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
    return;
  }

  try {
    const productReviews = await Review.find({ productId }).populate("userId", {
      firstName: 1,
    });

    if (!productReviews.length) {
      res.status(400).json({
        success: false,
        message: "No reviews found",
      });
      return;
    }

    // calculating average rating
    const ratingsCount = productReviews.length;
    const totalRating = productReviews.reduce(
      (acc, currentReview) => acc + currentReview.rating,
      0
    );
    const averageRating = Math.round((totalRating / ratingsCount) * 100) / 100;

    res.status(200).json({
      success: true,
      data: {
        ratingsCount,
        averageRating,
        productReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// TODO validate data
export const postProductReview: UserRequestHandler<
  { productId: string },
  any,
  postProductReviewBodyType
> = async (req, res, next) => {
  const userId = req.userId as string;

  console.log("UserId: ", userId);

  const { productId } = req.params;

  if (!productId) {
    res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
    return;
  }

  try {
    const createdReview = await Review.create({
      ...req.body,
      userId,
      productId,
    });
    // also update product
    const updatedProduct = await Product.findById(productId);
    if (!updatedProduct) {
      res.status(400).json({
        success: false,
        message: "Product not found",
      });

      return;
    }
    const oldAvg = updatedProduct.avgRating;
    const ratingsCount = updatedProduct.ratingsCount;
    let newAvg = (oldAvg * ratingsCount + req.body.rating) / (ratingsCount + 1);
    newAvg = Math.round(newAvg * 100) / 100;

    updatedProduct.avgRating = newAvg;
    updatedProduct.ratingsCount = ratingsCount + 1;
    await updatedProduct.save();

    res.status(201).json({
      success: true,
      data: createdReview,
    });
  } catch (error) {
    next(error);
  }
};
