import { Router } from "express";
import {
  deleteProduct,
  getHeroProducts,
  getProduct,
  getProducts,
  getRelatedProducts,
  patchProduct,
  postProduct,
} from "../controllers/productController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

export const productsRouter = Router()
  .get("/hero", getHeroProducts)
  .post("/", adminAccessMiddleware, postProduct)
  .get("/", getProducts)
  .get("/:id", getProduct)
  .get("/:id/related", getRelatedProducts)
  .patch("/:id", adminAccessMiddleware, patchProduct)
  .delete("/:id", adminAccessMiddleware, deleteProduct);
