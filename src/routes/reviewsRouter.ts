import { Router } from "express";
import {
  getProductReviews,
  getReview,
  postProductReview,
} from "../controllers/reviewsController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/reviews
export const reviewsRouter = Router()
  .get("/:id", getReview)
  .get("/product/:productId", getProductReviews)
  .post("/product/:productId", userAccessMiddleware, postProductReview);
