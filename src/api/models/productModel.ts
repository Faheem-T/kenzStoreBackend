import mongoose from "mongoose";

export const Product = mongoose.model(
  "Product",
  new mongoose.Schema(
    {
      name: String,
      description: String,
      price: Number,
      quantity: Number,
      listed: Boolean,
      images: [String],
      categories: [{ type: mongoose.Types.ObjectId, ref: "Category" }],
    },
    { timestamps: true }
  )
);
