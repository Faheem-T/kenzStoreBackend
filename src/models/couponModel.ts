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
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      min: [0, "Discount cannot be less than 0"],
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
      //   required: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
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
  return (
    !this.isDeleted && (this.validUntil ? this.validUntil > new Date() : true)
  );
});

export const Coupon = mongoose.model("Coupon", couponSchema);
