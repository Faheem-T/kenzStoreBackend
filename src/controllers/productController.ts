import { RequestHandler } from "express";
import { Product } from "../models/productModel";
import { populateCategory } from "../utils/populateCategoryHelper";
import { CreateProductType, UpdateProductType } from "../types/product";
import mongoose from "mongoose";

// Fields to be included when sending
const productProjection = {
  name: 1,
  description: 1,
  price: 1,
  brand: 1,
  images: 1,
  category: 1,
  specifications: 1,
  stock: 1,
  isHero: 1,
  discountStartDate: 1,
  discountEndDate: 1,
  discountValue: 1,
  discountType: 1,
  isDeleted: 1,
};

export const finalPriceCalculationAggregation = [
  {
    $addFields: {
      // Calculate product discount only if within the valid date range
      productDiscount: {
        $cond: [
          {
            $and: [
              { $eq: ["$discountType", "percentage"] },
              { $lte: ["$discountStartDate", new Date()] },
              { $gte: ["$discountEndDate", new Date()] },
            ],
          },
          { $multiply: ["$discountValue", "$price", 0.01] },
          {
            $cond: [
              {
                $and: [
                  { $eq: ["$discountType", "fixed"] },
                  { $lte: ["$discountStartDate", new Date()] },
                  { $gte: ["$discountEndDate", new Date()] },
                ],
              },
              "$discountValue",
              0,
            ],
          },
        ],
      },
      productDiscountName: {
        $cond: [
          {
            $and: [
              {
                $or: [
                  { $eq: ["$discountType", "percentage"] },
                  { $eq: ["$discountType", "fixed"] },
                ],
              },
              { $lte: ["$discountStartDate", new Date()] },
              { $gte: ["$discountEndDate", new Date()] },
            ],
          },
          "$discountName",
          null,
        ],
      },
      categoryDiscount: {
        $cond: [
          {
            $and: [
              { $eq: ["$category.discountType", "percentage"] },
              { $lte: ["$category.discountStartDate", new Date()] },
              { $gte: ["$category.discountEndDate", new Date()] },
            ],
          },
          { $multiply: ["$category.discountValue", "$price", 0.01] },
          {
            $cond: [
              {
                $and: [
                  { $eq: ["$category.discountType", "fixed"] },
                  { $lte: ["$category.discountStartDate", new Date()] },
                  { $gte: ["$category.discountEndDate", new Date()] },
                ],
              },
              "$category.discountValue",
              0,
            ],
          },
        ],
      },
      categoryDiscountName: {
        $cond: [
          {
            $and: [
              {
                $or: [
                  { $eq: ["$category.discountType", "percentage"] },
                  { $eq: ["$category.discountType", "fixed"] },
                ],
              },
              { $lte: ["$category.discountStartDate", new Date()] },
              { $gte: ["$category.discountEndDate", new Date()] },
            ],
          },
          "$category.discountName",
          null,
        ],
      },
    },
  },
  {
    $addFields: {
      effectiveDiscount: {
        $max: ["$productDiscount", "$categoryDiscount"],
      },
      appliedDiscountName: {
        $cond: [
          { $gt: ["$productDiscount", "$categoryDiscount"] },
          "$productDiscountName",
          {
            $cond: [
              { $gt: ["$categoryDiscount", "$productDiscount"] },
              "$categoryDiscountName",
              null,
            ],
          },
        ],
      },
      finalPrice: {
        $subtract: [
          "$price",
          { $max: ["$productDiscount", "$categoryDiscount"] },
        ],
      },
    },
  },
];

export const singleProductProjection = {
  $project: {
    name: 1,
    description: 1,
    price: 1,
    images: 1,
    avgRating: 1,
    isDeleted: 1,
    specifications: 1,
    productDiscount: 1,
    categoryDiscount: 1,
    effectiveDiscount: 1,
    finalPrice: 1,
    appliedDiscountName: 1,
    "category.name": 1,
    stock: 1,
  },
};

// get a product by its ID
export const getProduct: RequestHandler<{ id: string }> = async (
  req,
  res,
  next
) => {
  const productId = req.params.id;
  try {
    const foundProduct = await Product.findById(
      productId,
      productProjection
    ).populate(populateCategory());
    // const foundProduct = await Product.aggregate([
    // Add a match stage for searching
    //   {
    //     $match: {
    //       _id: new mongoose.Types.ObjectId(productId),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "categories", // Collection name for categories
    //       localField: "category",
    //       foreignField: "_id",
    //       as: "category",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$category",
    //       preserveNullAndEmptyArrays: true, // Allow products without a category
    //     },
    //   },
    //   ...finalPriceCalculationAggregation,
    //   singleProductProjection,
    // ]);
    // const foundProduct = await Product.findById(productId).populate("category");
    console.log(productId);
    console.log(foundProduct);

    if (!foundProduct?.isDeleted) {
      res.status(200).json({
        success: true,
        data: foundProduct,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  } catch (error) {
    next(error);
  }
};

// create a new product
export const postProduct: RequestHandler<any, any, CreateProductType> = async (
  req,
  res,
  next
) => {
  console.log("Create Product Body: \n", req.body);
  try {
    const createdProduct = await Product.create({ ...req.body });
    res.status(201).json({
      success: true,
      data: createdProduct,
    });
  } catch (error) {
    next(error);
  }
};

// update a product
export const patchProduct: RequestHandler<
  { id: string },
  any,
  UpdateProductType
> = async (req, res, next) => {
  const { id } = req.params;
  console.log(req.body);
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, { ...req.body });
    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// get all products
export const getProducts: RequestHandler<
  void,
  any,
  any,
  {
    page: string;
    sort: "asc" | "desc";
    sortBy: string;
    limit: string;
    q: string;
  }
> = async (req, res, next) => {
  const {
    page = "1",
    sort = "asc",
    limit = "10",
    q = "",
    sortBy = "createdAt",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrder = sort === "asc" ? 1 : -1;

  // Validate parsed parameters
  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
    });
    return;
  }

  // Whitelist of fields allowed for sorting
  const validSortFields = ["createdAt", "price", "name", "avgRating"];
  if (!validSortFields.includes(sortBy)) {
    res.status(400).json({
      success: false,
      message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(
        ", "
      )}`,
    });
    return;
  }

  try {
    const foundProducts = await Product.find({
      isDeleted: { $ne: true },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .populate(populateCategory())
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    // const foundProducts = await Product.aggregate([
    //   // Add a match stage for searching
    //   {
    //     $match: {
    //       $or: [
    //         { name: { $regex: q, $options: "i" } },
    //         { description: { $regex: q, $options: "i" } },
    //       ], // Search by name and description (case-insensitive)
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "categories", // Collection name for categories
    //       localField: "category",
    //       foreignField: "_id",
    //       as: "category",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$category",
    //       preserveNullAndEmptyArrays: true, // Allow products without a category
    //     },
    //   },
    //   ...finalPriceCalculationAggregation,
    //   // Sort based on query parameters
    //   {
    //     $sort: {
    //       [sortBy]: sortOrder,
    //     },
    //   },
    //   // Add pagination
    //   {
    //     $skip: (pageNum - 1) * limitNum,
    //   },
    //   {
    //     $limit: limitNum,
    //   },
    //   {
    //     $project: {
    //       name: 1,
    //       price: 1,
    //       images: 1,
    //       productDiscount: 1,
    //       avgRating: 1,
    //       categoryDiscount: 1,
    //       effectiveDiscount: 1,
    //       finalPrice: 1,
    //       appliedDiscountName: 1,
    //       "category.name": 1,
    //     },
    //   },
    // ]);
    console.log(foundProducts);

    res.status(200).json({
      success: true,
      data: foundProducts,
      count: foundProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

// get all `Hero` products
export const getHeroProducts: RequestHandler = async (req, res, next) => {
  try {
    const heroProducts = await Product.find(
      { isHero: true, listed: true },
      productProjection
    ).populate("category");
    res.status(200).json({
      success: true,
      data: heroProducts,
      count: heroProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

// get related products
export const getRelatedProducts: RequestHandler<
  { id: string },
  any,
  void,
  { limit?: string }
> = async (req, res, next) => {
  const { id } = req.params;
  let { limit = 5 } = req.query;
  if (typeof limit === "string") {
    limit = parseInt(limit, 10);
  }

  try {
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      isDeleted: { $ne: true },
      $or: [
        { category: currentProduct.category },
        { brand: currentProduct.brand },
      ],
    })
      .limit(limit)
      .populate(
        "category",
        "name discountType discountValue discountName discountStartDate discountEndDate"
      );

    // const relatedProducts = await Product.aggregate([
    //   {
    //     _id: { $ne: id },
    //     isDeleted: { $ne: true },
    //     $or: [
    //       { category: currentProduct.category },
    //       { brand: currentProduct.brand },
    //     ],
    //   },
    //   productProjection
    // ]
    //   .limit(limit)
    //   .populate("category")
    //   .exec();

    // const relatedProducts = await Product.aggregate([
    //   {
    //     $match: {
    //       _id: { $ne: new mongoose.Types.ObjectId(id) },
    //       isDeleted: { $ne: true },
    //       $or: [
    //         { category: currentProduct.category },
    //         { brand: currentProduct.brand },
    //       ],
    //     },
    //     $limit: limit,
    //   },
    // ]);

    res.status(200).json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// delete a product by its id
export const deleteProduct: RequestHandler<{ id: string }> = async (
  req,
  res,
  next
) => {
  const productId = req.params.id;
  if (!productId) {
    res.status(404).json({
      success: false,
      message: "Product ID not found",
    });
    return;
  }

  try {
    // soft deletion
    await Product.findByIdAndUpdate(productId, { isDeleted: true });
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
