import mongoose from "mongoose";

export interface CouponType {
  name: string;
  code: string;
  discountPercentage: number;
  limitPerUser: number;
  minOrderAmount: number;
  description?: string;
  validUntil?: Date;
  totalUsedCount: number;
  redeemedUsers: mongoose.Schema.Types.ObjectId[]; // ObjectIds

  // deletion indicator
  isDeleted: boolean;

  // virtuals
  isValid: boolean;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCouponType = Pick<
  CouponType,
  | "name"
  | "code"
  | "description"
  | "discountPercentage"
  | "limitPerUser"
  | "validUntil"
  | "minOrderAmount"
>;

export type UpdateCouponType = Partial<CreateCouponType>;
