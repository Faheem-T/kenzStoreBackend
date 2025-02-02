import mongoose from "mongoose";
import { ProductType } from "./product";
import { ItemType, ProductPopulatedItem } from "./item";

// SHARED TYPE: Sync with frontend
export interface CartType {
  _id: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  items: ItemType[];
  coupon: mongoose.Schema.Types.ObjectId | null;
  discountValue: number;
  discountType: "percentage" | "fixed" | null;
  // virtual
  cartTotal: number;
}
// SHARED TYPE: Sync with frontend
export interface ProductPopulatedCartType extends Omit<CartType, "items"> {
  items: ProductPopulatedItem[];
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
