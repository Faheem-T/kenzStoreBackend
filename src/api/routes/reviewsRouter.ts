import { Router } from "express";
import { getProductReviews, getReview, postProductReview } from "../handlers/reviewsHandler";

export const reviewsRouter = Router()
    .get("/:id", getReview)
    .get("/product/:productId", getProductReviews)
.post("/product/:productId", postProductReview)
