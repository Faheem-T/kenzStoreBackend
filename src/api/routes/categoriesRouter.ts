import { Router } from "express";
import {
  getCategory,
  postCategory,
  getCategories,
  deleteCategory,
  updateCategory,
} from "../controllers/categoriesController";

export const categoriesRouter = Router()
  .get("/", getCategories)
  .post("/", postCategory)
  .get("/:id", getCategory)
  .delete("/:id", deleteCategory)
  .patch("/:id", updateCategory);
