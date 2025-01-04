import { Router } from "express";
import { getCategory, postCategory, getCategories, deleteCategory } from "../handlers/categoriesHandler";

export const categoriesRouter = Router()
    .get("/", getCategories)
    .post("/", postCategory)
    .get("/:id", getCategory)
    .delete("/:id", deleteCategory)
