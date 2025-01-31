import mongoose from "mongoose";
import { CouponType } from "../types/coupon";

type ICoupon = CouponType & mongoose.Document;

const couponSchema = new mongoose.Schema<ICoupon>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    description: String,
    totalUsedCount: {
      type: Number,
      default: 0,
    },
    limitPerUser: {
      type: Number,
      default: 1,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    redeemedUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

couponSchema.virtual("isValid").get(function () {
  return !this.isDeleted && this.validUntil > new Date();
});

export const Coupon = mongoose.model("Coupon", couponSchema);
