import { Category } from "../models/categoryModel";
import { Product } from "../models/productModel";
import { AdminRequestHandler } from "../types/authenticatedRequest";

interface NewOfferBodyType {
  name: string;
  products?: string[];
  categories?: string[];
  startDate: Date;
  endDate: Date;
  discountType: "percentage" | "fixed";
  discountValue: number;
}
export const postNewProductOffer: AdminRequestHandler<
  {},
  any,
  NewOfferBodyType
> = async (req, res, next) => {
  const { name, products, startDate, endDate, discountType, discountValue } =
    req.body;

  if (!products) {
    res.status(400).json({
      success: false,
      message: "'products' array not found",
    });
    return;
  }

  try {
    const updatedProducts = await Product.updateMany(
      { _id: { $in: [...products] } },
      {
        discountName: name,
        discountStartDate: startDate,
        discountEndDate: endDate,
        discountType,
        discountValue,
      },
      {}
    );

    res.status(200).json({
      success: true,
      message: `Offer applied to ${updatedProducts.modifiedCount} products.`,
    });
  } catch (error) {
    next(error);
  }
};

export const postNewCategoryOffer: AdminRequestHandler<
  {},
  any,
  NewOfferBodyType
> = async (req, res, next) => {
  const { name, categories, startDate, endDate, discountType, discountValue } =
    req.body;
  if (!categories) {
    res.status(400).json({
      success: false,
      message: "'categories' array not found.",
    });
    return;
  }

  try {
    const updatedCategories = await Category.updateMany(
      { _id: { $in: [...categories] } },
      {
        discountName: name,
        discountStartDate: startDate,
        discountEndDate: endDate,
        discountType,
        discountValue,
      }
    );
    res.status(200).json({
      success: true,
      message: `Offer applied to ${updatedCategories.modifiedCount} categories`,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOfferProducts: AdminRequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const foundProductOffers = await Product.find({
      discountEndDate: { $gt: new Date() },
      discountStartDate: { $lt: new Date() },
    });
    res.status(200).json({
      success: true,
      data: foundProductOffers,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOfferCategories: AdminRequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const foundCategoryOffers = await Category.find({
      discountEndDate: { $gt: new Date() },
      discountStartDate: { $lt: new Date() },
    });
    res.status(200).json({
      success: true,
      data: foundCategoryOffers,
    });
  } catch (error) {
    next(error);
  }
};
