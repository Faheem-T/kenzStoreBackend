import { Router } from "express";
import { userAuthRouter } from "./userAuthRouter";
import { productsRouter } from "./productRouter";
import { categoriesRouter } from "./categoriesRouter";
import { reviewsRouter } from "./reviewsRouter";
import { adminRouter } from "./adminRouter";
import { userRouter } from "./userRoutes/userRouter";

export const rootRouter = Router()
  .use("/auth", userAuthRouter)
  .use("/products", productsRouter)
  .use("/categories", categoriesRouter)
  .use("/reviews", reviewsRouter)
  .use("/admin", adminRouter)
  .use("/users", userRouter);
