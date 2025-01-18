import { RequestHandler } from "express";
import { Review } from "../models/reviewModel";
import { postProductReviewBodyType } from "../types/requestBodyTypes";

export const getReview: RequestHandler<{ id: string }> = async (req, res, next) => {
    const reviewId = req.params.id
    try {
        const foundReview = await Review.findById(reviewId)
        res.status(200).json({
            success: true,
            data: foundReview
        })
    } catch (error) {
        next(error)
    }
}

export const getProductReviews: RequestHandler<{ productId: string }> = async (req, res, next) => {
    const { productId } = req.params

    if (!productId) {
        res.status(400).json({
            success: false,
            message: "Product ID is required"
        })
        return;
    }


    try {
        const productReviews = await Review
            .find({ productId })
            .populate("userId", { firstName: 1 })

        if (!productReviews.length) {
            res.status(400).json({
                success: false,
                message: "No reviews found"
            })
            return
        }

        // calculating average rating
        const ratingsCount = productReviews.length
        const totalRating = productReviews.reduce((acc, currentReview) => acc + currentReview.rating, 0)
        const averageRating = totalRating / ratingsCount

        res.status(200).json({
            success: true,
            data: {
                ratingsCount,
                averageRating,
                productReviews,
            }
        })
    } catch (error) {
        next(error)
    }
}

// TODO validate data
export const postProductReview: RequestHandler<{ productId: string }, any, postProductReviewBodyType> = async (req, res, next) => {
    const { productId } = req.params

    if (!productId) {
        res.status(400).json({
            success: false,
            message: "Product ID is required"
        })
        return;
    }

    try {
        const createdReview = await Review.create({ ...req.body, productId })
        res.status(201).json({
            success: true,
            data: createdReview
        })
    } catch (error) {
        next(error)
    }
}
