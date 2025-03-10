import mongoose from "mongoose";

// SHARED TYPE: Sync with frontend
export interface CouponType {
  _id: mongoose.Schema.Types.ObjectId;
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  limitPerUser: number;
  minOrderAmount: number;
  description?: string;
  validUntil?: Date;
  totalUsedCount: number;
  redeemedUsers: mongoose.Types.ObjectId[]; // ObjectIds

  // deletion indicator
  isDeleted: boolean;

  // virtuals
  isValid: boolean;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}
// SHARED TYPE: Sync with frontend
export type CreateCouponType = Pick<
  CouponType,
  "name" | "code" | "description" | "discountValue"
> & {
  limitPerUser?: number;
  validUntil?: Date;
  minOrderAmount?: number;
  discountType?: "percentage" | "fixed";
};
// SHARED TYPE: Sync with frontend
export type UpdateCouponType = Partial<CreateCouponType>;
