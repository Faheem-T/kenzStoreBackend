import { Router } from "express";
import {userAuthRouter} from "./userAuthRouter"
import { productsRouter } from "./productRouter";
import { categoriesRouter } from "./categoriesRouter";
import { reviewsRouter } from "./reviewsRouter";
import { adminAuthRouter } from "./adminAuthRouter";

export const rootRouter = Router()
    .use("/auth", userAuthRouter)
    .use("/products", productsRouter)
    .use("/categories", categoriesRouter)
    .use("/reviews", reviewsRouter)
.use("/admin", adminAuthRouter)
