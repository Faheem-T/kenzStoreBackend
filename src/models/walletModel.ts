import mongoose from "mongoose";
import { walletHistoryTypes, WalletType } from "../types/wallet";

type IWallet = WalletType & mongoose.Document;

const walletSchema = new mongoose.Schema<IWallet>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      min: [0, "Wallet balance cannot be less than 0"],
      default: 0,
    },
    history: {
      type: [
        {
          amount: { type: Number, required: true },
          logType: { type: String, enum: walletHistoryTypes, required: true },
          notes: String,
          timestamp: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
