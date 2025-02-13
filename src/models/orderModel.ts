import mongoose from "mongoose";
import { orderStatuses, OrderType, paymentStatuses } from "../types/order";

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
      enum: orderStatuses,
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
    completedAt: {
      type: Date,
    },
    // payment related
    paymentOrder: {
      type: mongoose.Schema.Types.Mixed,
    },
    paymentStatus: {
      type: String,
      enum: paymentStatuses,
      default: "incomplete",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.virtual("originalPrice").get(function () {
  let total = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  return Math.round(total * 100) / 100;
});

orderSchema.virtual("totalPrice").get(function () {
  let total = this.originalPrice;
  if (this.coupon && this.discountType && this.discountValue) {
    if (this.discountType === "percentage") {
      total = total * (1 - this.discountValue / 100);
    } else {
      total = total - this.discountValue;
    }
  }
  return Math.round(Math.max(total, 0) * 100) / 100;
});

export const Order = mongoose.model("Order", orderSchema);
