import mongoose from "mongoose";

// SHARED
export interface WalletType {
  user: mongoose.Schema.Types.ObjectId;
  balance: number;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}
