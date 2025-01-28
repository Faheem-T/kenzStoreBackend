import mongoose, { Document } from "mongoose";
import { CategoryType } from "../types/category";
import { calculateDiscountActive } from "../utils/calculateDiscount";

type ICategory = Document & CategoryType;

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentCategory: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Discount related fields
    discountName: {
      type: String,
    },
    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "Discount type must be either 'percentage' or 'fixed'",
      },
    },
    discountValue: {
      type: Number,
      min: [0, "Discount value cannot be negative"],
      validate: {
        validator: function (v) {
          // If discount type is percentage, value should not exceed 100
          if (this.discountType === "percentage") {
            return v <= 100;
          }
          return true;
        },
        message: "Invalid discount value",
      },
    },
    discountStartDate: {
      type: Date,
      validate: {
        validator: function (v) {
          // Start date must be present if discount type is set
          return !this.discountType || v != null;
        },
        message: "Start date is required when setting a discount",
      },
    },
    discountEndDate: {
      type: Date,
      validate: {
        validator: function (v) {
          // End date must be after start date
          return !this.discountStartDate || v > this.discountStartDate;
        },
        message: "End date must be after start date",
      },
    },
  },
  { timestamps: true }
);

// Pre-save middleware on the schema
CategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

CategorySchema.virtual("isDiscountActive").get(function () {
  const { discountStartDate, discountEndDate } = this;
  if (!discountStartDate || !discountEndDate) {
    return false;
  }
  return calculateDiscountActive({ discountEndDate, discountStartDate });
});

export const Category = mongoose.model("Category", CategorySchema);
