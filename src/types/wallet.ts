import mongoose from "mongoose";

// SHARED
export interface WalletType {
  user: mongoose.Schema.Types.ObjectId;
  balance: number;
  history: {
    _id?: mongoose.Schema.Types.ObjectId;
    amount: number;
    logType: WalletHistoryType;
    notes?: string;
    timestamp: Date;
  }[];
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// SHARED
export const walletHistoryTypes = [
  "order payment",
  "order cancellation",
  "refund",
  "referral reward",
  "other",
] as const;
type WalletHistoryType = (typeof walletHistoryTypes)[number];
