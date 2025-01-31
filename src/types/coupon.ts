import mongoose from "mongoose";

export interface CouponType {
  name: string;
  code: string;
  description?: string;
  totalUsedCount: number;
  limitPerUser: number;
  validUntil: Date;
  redeemedUsers: mongoose.Schema.Types.ObjectId[]; // ObjectIds

  // deletion indicator
  isDeleted: boolean;

  // virtuals
  isValid: boolean;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}
