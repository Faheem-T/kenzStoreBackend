import { Router } from "express";
import { addProductToCart, getCart } from "../controllers/cartController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/cart
export const cartRouter = Router()
  .patch("/", userAccessMiddleware, addProductToCart)
  .get("/", userAccessMiddleware, getCart);
