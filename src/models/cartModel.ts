import mongoose from "mongoose";
import { CartType } from "../types/cart";

type ICart = CartType & mongoose.Document;

const cartSchema = new mongoose.Schema<ICart>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price cannot be negative"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity cannot be less than 1"],
        },
      },
    ],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

cartSchema.index({ userId: 1, "items.productId": 1 });

cartSchema.virtual("cartTotal").get(function () {
  const total = this.items.reduce(
    (acc, current) => acc + current.price * current.quantity,
    0
  );
  let subTotal;
  if (this.discountType === "fixed") {
    subTotal = total - this.discountValue;
  } else {
    subTotal = total * (1 - this.discountValue / 100);
  }
  return Math.round(subTotal * 100) / 100;
});
export const Cart = mongoose.model("Cart", cartSchema);
