import { Router } from "express";
import {
  addProductToCart,
  clearCart,
  deleteProductFromCart,
  getCart,
  getMinimalCart,
} from "../controllers/cartController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/cart
export const cartRouter = Router()
  .patch("/", userAccessMiddleware, addProductToCart)
  .get("/", userAccessMiddleware, getCart)
  .get("/minimal", userAccessMiddleware, getMinimalCart)
  .delete("/items/:productId", userAccessMiddleware, deleteProductFromCart)
  .delete("/", userAccessMiddleware, clearCart);
