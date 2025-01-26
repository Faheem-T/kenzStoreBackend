import { RequestHandler } from "express";
import { Product } from "../models/productModel";
import { populateCategory } from "../utils/populateCategoryHelper";
import { CreateProductType, UpdateProductType } from "../types/product";

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
    // filterField: string;
  }
> = async (req, res, next) => {
  const {
    page = "1",
    sort = "asc",
    limit = "10",
    q = "",
    // filterField,
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
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate(populateCategory())
      .exec();

    // const currentDate = new Date();
    // const isQueryPresent = false;
    // const foundProducts = await Product.aggregate([
    //   {
    //     $match: {
    //       isDeleted: { $ne: true },
    //       $or: [
    //         { name: { $regex: q, $options: "i" } },
    //         { description: { $regex: q, $options: "i" } },
    //       ],
    //     },
    //   },
    //   {
    //     $addFields: {
    //       avgRating: {
    //         $cond: {
    //           if: { $eq: ["$ratingsCount", 0] }, // Check if ratingsCount is zero
    //           then: 0, // Default value if true
    //           else: {
    //             $round: [{ $divide: ["$sumOfRatings", "$ratingsCount"] }, 2],
    //           }, // Calculate avgRating if false
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $sort: { [sortBy]: sortOrder },
    //   },
    //   {
    //     $skip: (pageNum - 1) * limitNum,
    //   },
    //   {
    //     $limit: limitNum,
    //   },
    //   {
    //     $lookup: {
    //       from: "categories",
    //       localField: "category",
    //       foreignField: "_id",
    //       as: "category",
    //     },
    //   },
    //   {
    //     $unwind: "$category",
    //   },
    //   {
    //     $addFields: {
    //       isDiscountActive: {
    //         $and: [
    //           { $ifNull: ["$discountStartDate", false] },
    //           { $ifNull: ["$discountEndDate", false] },
    //           { $lte: ["$discountStartDate", currentDate] },
    //           { $gte: ["$discountEndDate", currentDate] },
    //         ],
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       finalPrice: {
    //         $cond: {
    //           if: "$isDiscountActive",
    //           then: {
    //             $switch: {
    //               branches: [
    //                 {
    //                   case: { $eq: ["$discountType", "percentage"] },
    //                   then: {
    //                     $round: [
    //                       {
    //                         $multiply: [
    //                           "$price",
    //                           {
    //                             $subtract: [
    //                               1,
    //                               { $divide: ["$discountValue", 100] },
    //                             ],
    //                           },
    //                         ],
    //                       },
    //                       2,
    //                     ],
    //                   },
    //                 },
    //                 {
    //                   case: { $eq: ["$discountType", "fixed"] },
    //                   then: { $subtract: ["$price", "$discountValue"] },
    //                 },
    //               ],
    //               default: "$price",
    //             },
    //           },
    //           else: "$price",
    //         },
    //       },
    //     },
    //   },
    // ]);
    // console.log(foundProducts);

    console.log("sort", sort, " ", sortOrder);
    console.log("SortBy", sortBy);

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
    const relatedProducts = await Product.find(
      {
        _id: { $ne: id },
        isDeleted: { $ne: true },
        $or: [
          { category: currentProduct.category },
          { brand: currentProduct.brand },
        ],
      },
      productProjection
    )
      .limit(limit)
      .populate("category")
      .exec();

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
