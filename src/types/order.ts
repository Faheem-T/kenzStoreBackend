import mongoose from "mongoose";
import { AddressType } from "./address";

// SHARED TYPE: Sync with frontend
export interface OrderType {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  items: {
    productId: mongoose.Schema.Types.ObjectId;
    price: number;
    quantity: number;
  }[];
  status: "pending" | "completed" | "cancelled";
  paymentMethod: "COD" | "Credit Card" | "Debit Card";
  address: Pick<
    AddressType,
    "address_line" | "city" | "state" | "pincode" | "landmark"
  >;

  // Virtual fields
  totalPrice: number;

  // Timestamp fields
  createdAt: Date;
  updatedAt: Date;
}

// SHARED TYPE: Sync with frontend
export interface PlaceOrderType extends Pick<OrderType, "paymentMethod"> {
  cartId: string; // Cart ID
  addressId: string; // Address ID
}
