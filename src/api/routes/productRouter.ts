import { Router } from "express";
import { getHeroProducts, getProduct, patchProduct, postProduct } from "../handlers/productHandler";

export const productsRouter = Router()
    .get("/hero", getHeroProducts)
    .post("/", postProduct)
    .get("/:id", getProduct)
.patch("/:id", patchProduct)
