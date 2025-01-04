import { Router } from "express";
import { getHeroProducts, getProduct } from "../handlers/productHandler";

export const productsRouter = Router()
    .get("/hero", getHeroProducts)
    .get("/:id", getProduct)
