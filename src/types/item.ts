import mongoose from "mongoose";
import { ProductType } from "./product";

// SHARED TYPE: Sync with frontend
export interface ItemType {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  price: number;
  quantity: number;
}

// SHARED TYPE: Sync with frontend
export interface ProductPopulatedItem extends Omit<ItemType, "productId"> {
  productId: ProductType;
}
