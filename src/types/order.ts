import mongoose from "mongoose";
import { AddressType } from "./address";
import { ProductPopulatedItem } from "./item";
import { ProductType } from "./product";
import { Orders } from "razorpay/dist/types/orders";
import { CouponType } from "./coupon";

// SHARED TYPE: Sync with frontend
export interface OrderType {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  items: {
    productId: mongoose.Schema.Types.ObjectId;
    price: number;
    quantity: number;
  }[];
  coupon: mongoose.Schema.Types.ObjectId | null; // ObjectId
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  address: Pick<
    AddressType,
    "address_line" | "city" | "state" | "pincode" | "landmark"
  >;

  // Cancel & complete date
  cancelledAt?: Date;
  completedAt?: Date;

  // payment related fields
  paymentOrder: Orders.RazorpayOrder;
  paymentStatus: PaymentStatus;
  // Virtual fields
  originalPrice: number;
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
export const paymentMethods = ["cod", "online", "wallet"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

// SHARED TYPE: Sync with frontend
export const paymentStatuses = ["incomplete", "paid", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

// SHARED TYPE: Sync with frontend
export const orderStatuses = [
  "pending",
  "completed",
  "cancelled",
  "requesting return",
  "returned",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

// SHARED
export type GetUserOrder = ProductPopulatedOrderType<
  Pick<
    ProductType,
    "name" | "description" | "images" | "_id" | "effectiveDiscount"
  >
>;

// SHARED
export type OrderDetailsType = Omit<GetUserOrder, "coupon"> & {
  coupon: Pick<
    CouponType,
    "_id" | "name" | "code" | "discountType" | "discountValue"
  >;
};
