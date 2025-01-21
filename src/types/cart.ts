import mongoose from "mongoose";
import { ProductType } from "./product";

// SHARED TYPE: Sync with frontend
export interface CartType {
  userId: mongoose.Schema.Types.ObjectId;
  items: { productId: mongoose.Schema.Types.ObjectId; quantity: number }[];
}
// SHARED TYPE: Sync with frontend
export interface ProductPopulatedCartType extends Omit<CartType, "items"> {
  items: { productId: ProductType; quantity: number }[];
}
