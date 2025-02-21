import mongoose from "mongoose";

// SHARED TYPE: Sync with frontend
export interface UserType {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  DOB?: Date;
  password: string;
  // user verification fields
  expiresAt: Date | null;
  isVerified: boolean;
  isBlocked: boolean;
  referralCode: string;
  referredBy: mongoose.Types.ObjectId;
  // timestamp fields
  createdAt: Date;
  updatedAt: Date;
}

// SHARED TYPE: Sync with frontend
// without the password
export type SafeUserType = Omit<UserType, "password">;
