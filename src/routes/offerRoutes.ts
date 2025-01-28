import { Router } from "express";
import {
  getAllOfferCategories,
  getAllOfferProducts,
  postNewCategoryOffer,
  postNewProductOffer,
} from "../controllers/offerController";
import { adminAccessMiddleware } from "../middlewares/adminAccessMiddleware";

// v1/offers
export const offerRoutes = Router()
  .post("/products", adminAccessMiddleware, postNewProductOffer)
  .post("/categories", adminAccessMiddleware, postNewCategoryOffer)
  .get("/offer-products", getAllOfferProducts)
  .get("/offer-categories", getAllOfferCategories);
