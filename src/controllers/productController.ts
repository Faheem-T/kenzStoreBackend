import { HttpStatus } from "../utils/httpenum";
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

    if (!foundProduct?.isDeleted) {
      res.status(HttpStatus.OK).json({
        success: true,
        data: foundProduct,
      });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({
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
  // console.log("Create Product Body: \n", req.body);
  try {
    const createdProduct = await Product.create({ ...req.body });
    res.status(HttpStatus.CREATED).json({
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
  // console.log(req.body);
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, { ...req.body });
    res.status(HttpStatus.OK).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// get all products
// export const getProducts: RequestHandler<
//   void,
//   any,
//   any,
//   {
//     page: string;
//     sort: "asc" | "desc";
//     sortBy: string;
//     limit: string;
//     q: string;
//     category?: string;
//   }
// > = async (req, res, next) => {
//   const {
//     page = "1",
//     sort = "asc",
//     limit = "10",
//     q = "",
//     sortBy = "createdAt",
//     category = "",
//   } = req.query;

//   const pageNum = parseInt(page, 10);
//   const limitNum = parseInt(limit, 10);
//   const sortOrder = sort === "asc" ? 1 : -1;

//   // Validate parsed parameters
//   if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
//     res.status(HttpStatus.BAD_REQUEST).json({
//       success: false,
//       message: "Invalid pagination parameters",
//     });
//     return;
//   }

//   // Whitelist of fields allowed for sorting
//   const validSortFields = ["createdAt", "finalPrice", "name", "avgRating"];
//   if (!validSortFields.includes(sortBy)) {
//     res.status(HttpStatus.BAD_REQUEST).json({
//       success: false,
//       message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(
//         ", "
//       )}`,
//     });
//     return;
//   }

//   // console.log(typeof categories);
//   // console.log(categories);
//   const categoryCondition =
//     category !== ""
//       ? {
//           category,
//         }
//       : {};

//   try {
//     const foundProducts = await Product.find({
//       isDeleted: { $ne: true },
//       $or: [
//         { name: { $regex: q, $options: "i" } },
//         { description: { $regex: q, $options: "i" } },
//       ],
//       ...categoryCondition,
//     })
//       .populate(populateCategory())
//       .sort({ [sortBy]: sortOrder })
//       .skip((pageNum - 1) * limitNum)
//       .limit(limitNum)
//       .exec();

//     console.log(foundProducts);

//     res.status(HttpStatus.OK).json({
//       success: true,
//       count: foundProducts.length,
//       data: foundProducts,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

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
    category?: string;
  }
> = async (req, res, next) => {
  const {
    page = "1",
    sort = "asc",
    limit = "10",
    q = "",
    sortBy = "createdAt",
    category = "",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrder = sort === "asc" ? 1 : -1;

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    res
      .status(400)
      .json({ success: false, message: "Invalid pagination parameters" });
    return;
  }

  const validSortFields = ["createdAt", "finalPrice", "name", "avgRating"];
  if (!validSortFields.includes(sortBy)) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(
        ", "
      )}`,
    });
    return;
  }

  const matchStage: any = {
    isDeleted: { $ne: true },
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ],
  };

  if (category) {
    matchStage.category = new mongoose.Types.ObjectId(category);
  }

  try {
    const productsCount = await Product.find(matchStage).countDocuments();
    const totalPages = Math.ceil(productsCount / limitNum);
    const foundProducts = await Product.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          productDiscount: {
            $cond: {
              if: {
                $and: [
                  "$discountType",
                  "$discountValue",
                  "$discountStartDate",
                  "$discountEndDate",
                  { $lte: ["$discountStartDate", new Date()] },
                  { $gte: ["$discountEndDate", new Date()] },
                ],
              },
              then: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: {
                    $multiply: ["$price", { $divide: ["$discountValue", 100] }],
                  },
                  else: "$discountValue",
                },
              },
              else: 0,
            },
          },
          categoryDiscount: {
            $cond: {
              if: {
                $and: [
                  "$category.discountType",
                  "$category.discountValue",
                  "$category.discountStartDate",
                  "$category.discountEndDate",
                  { $lte: ["$category.discountStartDate", new Date()] },
                  { $gte: ["$category.discountEndDate", new Date()] },
                ],
              },
              then: {
                $cond: {
                  if: { $eq: ["$category.discountType", "percentage"] },
                  then: {
                    $multiply: [
                      "$price",
                      { $divide: ["$category.discountValue", 100] },
                    ],
                  },
                  else: "$category.discountValue",
                },
              },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          effectiveDiscount: {
            $cond: {
              if: { $gt: ["$productDiscount", "$categoryDiscount"] },
              then: {
                name: "$discountName",
                type: "$discountType",
                value: "$discountValue",
                startDate: "$discountStartDate",
                endDate: "$discountEndDate",
                discountApplied: "$productDiscount",
              },
              else: {
                name: "$category.discountName",
                type: "$category.discountType",
                value: "$category.discountValue",
                startDate: "$category.discountStartDate",
                endDate: "$category.discountEndDate",
                discountApplied: "$categoryDiscount",
              },
            },
          },
        },
      },
      {
        $addFields: {
          finalPrice: {
            $subtract: ["$price", "$effectiveDiscount.discountApplied"],
          },
        },
      },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      { $sort: { [sortBy]: sortOrder } },
    ]);
    // console.log(foundProducts);

    res.status(HttpStatus.OK).json({
      success: true,
      data: foundProducts,
      currentPage: pageNum,
      totalPages,
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
    res.status(HttpStatus.OK).json({
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
      res.status(HttpStatus.NOT_FOUND).json({
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

    res.status(HttpStatus.OK).json({
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
    res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: "Product ID not found",
    });
    return;
  }

  try {
    // soft deletion
    await Product.findByIdAndUpdate(productId, { isDeleted: true });
    res.status(HttpStatus.OK).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
