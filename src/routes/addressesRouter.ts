import { Router } from "express";
import {
  getUserAddresses,
  postUserAddress,
  setDefaultAddress,
  deleteAddress,
  updateAddress,
} from "../controllers/addressesController";
import { userAccessMiddleware } from "../middlewares/userAccessMiddleware";

// v1/addresses
export const addressesRouter = Router()
  .get("/user", userAccessMiddleware, getUserAddresses)
  .post("/user", userAccessMiddleware, postUserAddress)
  .patch("/:addressId/setDefault", userAccessMiddleware, setDefaultAddress)
  .delete("/:addressId", userAccessMiddleware, deleteAddress)
  .patch("/:addressId", userAccessMiddleware, updateAddress);
