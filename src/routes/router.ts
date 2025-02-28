import { Router } from "express";
import { userAuthRouter } from "./userAuthRouter";
import { productsRouter } from "./productRouter";
import { categoriesRouter } from "./categoriesRouter";
import { reviewsRouter } from "./reviewsRouter";
import { adminRouter } from "./adminRouter";
import { userRouter } from "./userRoutes/userRouter";
import { addressesRouter } from "./addressesRouter";
import { cartRouter } from "./cartRouter";
import { orderRouter } from "./orderRouter";
import { offerRoutes } from "./offerRouter";
import { couponRouter } from "./couponRouter";
import { wishlistRouter } from "./wishlistRouter";
import { paymentRouter } from "./paymentRouter";
import { walletRouter } from "./walletRouter";

// v1/
export const rootRouter = Router()
  .use("/auth", userAuthRouter)
  .use("/products", productsRouter)
  .use("/categories", categoriesRouter)
  .use("/reviews", reviewsRouter)
  .use("/admin", adminRouter)
  .use("/users", userRouter)
  .use("/addresses", addressesRouter)
  .use("/cart", cartRouter)
  .use("/orders", orderRouter)
  .use("/offers", offerRoutes)
  .use("/coupons", couponRouter)
  .use("/wishlist", wishlistRouter)
  .use("/payments", paymentRouter)
  .use("/wallets", walletRouter);
