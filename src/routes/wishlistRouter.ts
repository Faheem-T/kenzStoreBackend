import { Router } from "express";
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/wishlist
export const wishlistRouter = Router()
  .get("/", userAccessMiddleware, getWishlist)
  .post("/", userAccessMiddleware, addToWishlist)
  .delete("/product", userAccessMiddleware, removeFromWishlist)
  .delete("/", clearWishlist);
