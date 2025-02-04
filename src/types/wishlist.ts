import mongoose from "mongoose";

// SHARED TYPE: sync with frontend
export interface WishlistType {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
}
