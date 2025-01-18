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

export const productsRouter = Router()
  .get("/hero", getHeroProducts)
  .post("/", postProduct)
  .get("/", getProducts)
  .get("/:id", getProduct)
  .get("/:id/related", getRelatedProducts)
  .patch("/:id", patchProduct)
  .delete("/:id", deleteProduct);
