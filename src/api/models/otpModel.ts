import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    email: { type: String, required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 4 * 60 * 1000),
    },
  },
  { timestamps: true }
);

export const OTP = mongoose.model("OTP", otpSchema);
