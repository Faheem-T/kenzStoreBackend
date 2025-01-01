import mongoose from "mongoose";

export const Category = mongoose.model(
  "category",
  new mongoose.Schema(
    {
      name: String,
      parentCategory: { type: mongoose.Types.ObjectId, ref: "category" },
      listed: Boolean,
    },
    { timestamps: true }
  )
);
