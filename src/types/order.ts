import mongoose from "mongoose";
import { AddressType } from "./address";
import { ProductPopulatedItem } from "./item";
import { ProductType } from "./product";

// SHARED TYPE: Sync with frontend
export interface OrderType {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  items: {
    productId: mongoose.Schema.Types.ObjectId;
    price: number;
    quantity: number;
  }[];
  coupon: mongoose.Schema.Types.ObjectId; // ObjectId
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  address: Pick<
    AddressType,
    "address_line" | "city" | "state" | "pincode" | "landmark"
  >;

  // Cancel date
  cancelledAt: Date;

  // Virtual fields
  totalPrice: number;

  // Timestamp fields
  createdAt: Date;
  updatedAt: Date;
}

// SHARED TYPE: Sync with frontend
export interface ProductPopulatedOrderType<T = ProductType>
  extends Omit<OrderType, "items"> {
  items: ProductPopulatedItem<T>[];
}

// SHARED TYPE: Sync with frontend
export interface PlaceOrderType extends Pick<OrderType, "paymentMethod"> {
  cartId: string; // Cart ID
  addressId: string; // Address ID
}

// SHARED TYPE: Sync with frontend
export const paymentMethods = ["COD", "Credit Card", "Debit Card"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

// SHARED TYPE: Sync with frontend
export const orderStatuses = ["pending", "completed", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

// SHARED TYPE: Sync with frontend
export type GetUserOrder = ProductPopulatedOrderType<
  Pick<ProductType, "name" | "description" | "images" | "_id">
>;
