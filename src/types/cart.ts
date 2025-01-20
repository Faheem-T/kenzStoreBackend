import mongoose from "mongoose";

// SHARED TYPE: Sync with frontend
export interface CartType {
  userId: mongoose.Schema.Types.ObjectId;
  items: { productId: mongoose.Schema.Types.ObjectId; quantity: number }[];
}
