import mongoose from "mongoose";

export const Review = mongoose.model(
  "Review",
  new mongoose.Schema(
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
      rating: { type: Number, min: 0.5, max: 5, required: true },
      comment: {
        type: String,
        trim: true,
      },
      helpfulCount: {
        type: Number,
        default: 0,
      },
      verifiedPurchase: {
        type: Boolean,
        default: false,
      },
      // TODO Could add an images field here
    },
    {
      timestamps: true,
    }
  )
);
