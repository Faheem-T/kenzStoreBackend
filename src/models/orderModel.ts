import mongoose from "mongoose";
import { OrderType } from "../types/order";

type IOrder = OrderType & mongoose.Document;

const orderSchema = new mongoose.Schema<IOrder>(
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
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "Debit Card"],
      required: true,
    },
    address: {
      address_line: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
      },
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.virtual("totalPrice").get(function () {
  let total = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (this.coupon && this.discountType && this.discountValue) {
    if (this.discountType === "percentage") {
      total = total * (1 - this.discountValue / 100);
    } else {
      total = total - this.discountValue;
    }
  }
  return Math.max(total, 0);
});

export const Order = mongoose.model("Order", orderSchema);
