import { Router } from "express";
import {
  getCategory,
  postCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getCategoryProducts,
} from "../controllers/categoriesController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

export const categoriesRouter = Router()
  .get("/", getCategories)
  .post("/", adminAccessMiddleware, postCategory)
  .get("/:id", getCategory)
  .delete("/:id", adminAccessMiddleware, deleteCategory)
  .patch("/:id", adminAccessMiddleware, updateCategory)
  .get("/:slug/products", getCategoryProducts);
