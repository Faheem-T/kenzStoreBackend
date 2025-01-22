import mongoose from "mongoose";
import { ProductType } from "./product";

// SHARED TYPE: Sync with frontend
export interface CartType {
  _id: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  items: {
    _id: mongoose.Schema.Types.ObjectId;
    productId: mongoose.Schema.Types.ObjectId;
    price: number;
    quantity: number;
  }[];
}
// SHARED TYPE: Sync with frontend
export interface ProductPopulatedCartType extends Omit<CartType, "items"> {
  items: {
    _id: mongoose.Schema.Types.ObjectId;
    productId: Partial<ProductType>;
    price: number;
    quantity: number;
  }[];
}

export interface PickProductPopulatedCartType<P extends keyof ProductType>
  extends Omit<CartType, "items"> {
  items: {
    _id: mongoose.Schema.Types.ObjectId;
    productId: Pick<ProductType, P>;
    price: number;
    quantity: number;
  }[];
}
