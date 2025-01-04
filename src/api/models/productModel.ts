import mongoose from "mongoose";

export const Product = mongoose.model(
  "Product",
  new mongoose.Schema(
    {
      name: String,
      description: String,
      price: Number,
      stock: Number,
      listed: Boolean,
      images: [String],
      categories: [{ type: mongoose.Types.ObjectId, ref: "Category" }],
      isHero: { type: Boolean, default: false },
      specifications: {type: mongoose.Schema.Types.Mixed, default: {}}
    },
    { timestamps: true }
  )
);
