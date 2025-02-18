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
      isDeleted: { $ne: true },
      discountValue: { $nin: [null, 0] },
      // discountEndDate: { $gt: new Date() },
      // discountStartDate: { $lt: new Date() },
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
      isDeleted: { $ne: true },
      discountValue: { $nin: [null, 0] },
      // discountEndDate: { $gt: new Date() },
      // discountStartDate: { $lt: new Date() },
    });
    res.status(200).json({
      success: true,
      data: foundCategoryOffers,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductOffer: AdminRequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  const productId = req.params.productId;
  if (!productId) {
    res.status(400).json({
      success: false,
      message: "'productId' is required",
    });
    return;
  }

  try {
    const foundProduct = await Product.findByIdAndUpdate(
      productId,
      {
        discountName: "",
        discountType: "",
        discountValue: 0,
        discountStartDate: null,
        discountEndDate: null,
      },
      { new: true }
    );
    if (!foundProduct) {
      res.status(400).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Product offer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryOffer: AdminRequestHandler<{
  categoryId: string;
}> = async (req, res, next) => {
  const categoryId = req.params.categoryId;
  if (!categoryId) {
    res.status(400).json({
      success: false,
      message: "'categoryId' is required",
    });
    return;
  }

  try {
    const foundCategory = await Category.findByIdAndUpdate(categoryId, {
      discountName: "",
      discountType: "",
      discountValue: 0,
      discountStartDate: null,
      discountEndDate: null,
    });
    if (!foundCategory) {
      res.status(400).json({
        success: false,
        message: "Category not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Category offer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
