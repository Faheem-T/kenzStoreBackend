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
    categories: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Category",
        },
      ],
      validate: {
        validator: function (v) {
          return v.length > 0; // Ensure at least one category
        },
        message: "Product must belong to at least one category",
      },
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
    sumOfRatings: {
      type: Number,
      default: 0,
      min: [0, "Sum of ratings cannot be negative"],
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

ProductSchema.virtual("isDiscountActive").get(function () {
  const { discountStartDate, discountEndDate } = this;
  if (!discountStartDate || !discountEndDate) {
    return false;
  }
  return calculateDiscountActive({ discountEndDate, discountStartDate });
});

ProductSchema.virtual("finalPrice").get(function () {
  if (!this.discountType || !this.discountValue || !this.isDiscountActive) {
    return this.price;
  }
  return calculateDiscount({
    price: this.price,
    discountType: this.discountType,
    discountValue: this.discountValue,
  });
});

export const Product = mongoose.model("Product", ProductSchema);
