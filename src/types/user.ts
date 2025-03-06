import mongoose from "mongoose";

// SHARED TYPE: Sync with frontend
export type UserType = {
  _id: string;
  name: string;
  email: string;
  picture: string | null;

  // user verification fields
  expiresAt: Date | null;
  isVerified: boolean;
  isBlocked: boolean;

  // referral fields
  referralCode: string;
  referredBy: mongoose.Types.ObjectId;

  // timestamp fields
  createdAt: Date;
  updatedAt: Date;
} & (
  | {
      password: string;
      isGoogleLogin: false;
    }
  | { isGoogleLogin: true }
); // Google login users will not have a password field

// SHARED TYPE: Sync with frontend
// without the password
export type SafeUserType = Omit<UserType, "password">;
