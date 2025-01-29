import mongoose from "mongoose";
import { ProductType } from "../types/product";
import {
  calculateDiscount,
  calculateDiscountActive,
} from "../utils/calculateDiscount";
import { Document } from "mongoose";

type IProduct = Document & ProductType;

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    listed: {
      type: Boolean,
      default: true, // Most products will be listed by default
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length > 0; // Ensure at least one image
        },
        message: "Product must have at least one image",
      },
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isHero: { type: Boolean, default: false },

    // specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    specifications: [
      {
        name: String,
        value: String,
        // unit: String, // unit of measurement for the value
        category: {
          type: String,
          enum: ["technical", "physical", "feature"],
          required: true,
        },
        isHighlight: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Discount Related fields
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
          // If discount type is fixed, value should not exceed original price
          if (this.discountType === "fixed") {
            return v <= this.price;
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

    // Ratings related fields
    ratingsCount: {
      type: Number,
      default: 0,
      min: [0, "Ratings count cannot be negative"],
    },
    avgRating: {
      type: Number,
      default: 0,
      min: [0, "Average ratings cannot be negative"],
    },

    // For soft deletion
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Enable virtuals when converting to JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ProductSchema.virtual("isDiscountActive").get(function () {
//   const { discountStartDate, discountEndDate } = this;
//   if (!discountStartDate || !discountEndDate) {
//     return false;
//   }
//   return calculateDiscountActive({ discountEndDate, discountStartDate });
// });

// ProductSchema.virtual("finalPrice").get(function () {
//   if (!this.discountType || !this.discountValue || !this.isDiscountActive) {
//     return this.price;
//   }
//   return calculateDiscount({
//     price: this.price,
//     discountType: this.discountType,
//     discountValue: this.discountValue,
//   });
// });

ProductSchema.virtual("effectiveDiscount").get(function () {
  const now = new Date();

  // Check if product discount is active
  let productDiscount = 0;
  if (
    this.discountType &&
    this.discountValue &&
    this.discountStartDate &&
    this.discountEndDate &&
    this.discountStartDate <= now &&
    this.discountEndDate >= now
  ) {
    if (this.discountType === "percentage") {
      productDiscount = (this.discountValue / 100) * this.price;
    } else if (this.discountType === "fixed") {
      productDiscount = this.discountValue;
    }
  }

  // Placeholder for category discount (requires preloaded category)
  let categoryDiscount = 0;
  if (this.category && this.category.discountType) {
    if (
      this.category.discountStartDate <= now &&
      this.category.discountEndDate >= now
    ) {
      if (this.category.discountType === "percentage") {
        categoryDiscount = (this.category.discountValue / 100) * this.price;
      } else if (this.category.discountType === "fixed") {
        categoryDiscount = this.category.discountValue;
      }
    }
  }

  // Calculate the effective discount and final price
  // const effectiveDiscount = Math.max(productDiscount, categoryDiscount);

  if (productDiscount > categoryDiscount) {
    return {
      name: this.discountName,
      type: this.discountType,
      value: this.discountValue,
      startDate: this.discountStartDate,
      endDate: this.discountEndDate,
      discountApplied: productDiscount,
    };
  } else if (categoryDiscount > productDiscount) {
    return {
      name: this.category.discountName,
      type: this.category.discountType,
      value: this.category.discountValue,
      startDate: this.category.discountStartDate,
      endDate: this.category.discountEndDate,
      discountApplied: categoryDiscount,
    };
  } else {
    return null;
  }
});

ProductSchema.virtual("finalPrice").get(function () {
  return this.effectiveDiscount
    ? Math.round((this.price - this.effectiveDiscount.discountApplied) * 100) /
        100
    : this.price;
});

export const Product = mongoose.model("Product", ProductSchema);
