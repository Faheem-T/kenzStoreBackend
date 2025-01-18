import { Router } from "express";
import {
  getProductReviews,
  getReview,
  postProductReview,
} from "../controllers/reviewsController";

export const reviewsRouter = Router()
  .get("/:id", getReview)
  .get("/product/:productId", getProductReviews)
  .post("/product/:productId", postProductReview);
