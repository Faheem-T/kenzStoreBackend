import mongoose from "mongoose";
import type { WishlistType } from "../types/wishlist";

type IWishlist = WishlistType & mongoose.Document;

const wishlistSchema = new mongoose.Schema<IWishlist>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  products: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    default: [],
  },
});

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
