import { Router } from "express";
import { authRouter } from "./authRouter";
import { productsRouter } from "./productRouter";
import { categoriesRouter } from "./categoriesRouter";

export const rootRouter = Router()
    .use("/auth", authRouter)
    .use("/products", productsRouter)
.use("/categories", categoriesRouter)
