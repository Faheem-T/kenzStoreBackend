import mongoose from "mongoose";
import { UserType } from "../types/user";

export type IUser = UserType & mongoose.Document;

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: { type: String, required: true },
    password: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // expires 24 hours from creation
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      default: null,
      minlength: 6,
      maxlength: 6,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    picture: {
      type: String,
      default: null,
    },
    isGoogleLogin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Delete immediately after expiry

export const User = mongoose.model("User", userSchema);
