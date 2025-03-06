import { HttpStatus } from "../utils/httpenum";
import { RequestHandler } from "express";
import { Category } from "../models/categoryModel";
import { populateCategory } from "../utils/populateCategoryHelper";
import { UpdateCategoryType } from "../types/category";
import { Product } from "../models/productModel";

const categoryProjection = {
  name: 1,
  parentCategory: 1,
  description: 1,
  image: 1,
  listed: 1,
  createdAt: 1,
  updatedAt: 1,
};

export const getCategoryProducts: RequestHandler<
  { slug: string },
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
  const slug = req.params.slug;
  if (!slug) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "'slug' is required",
    });
    return;
  }

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

  try {
    const foundCategory = await Category.findOne({ slug }).lean();
    if (!foundCategory) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: `Couldn't find category with slug ${slug}`,
      });
      return;
    }

    const matchStage: any = {
      isDeleted: { $ne: true },
      category: foundCategory._id,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    // const categoryProducts = await Product.find({
    //   category: foundCategory._id,
    // });

    const categoryProducts = await Product.aggregate([
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
      { $sort: { [sortBy]: sortOrder } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ]);

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        products: categoryProducts,
        category: foundCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategory: RequestHandler<{ id: string }> = async (
  req,
  res,
  next
) => {
  const categoryId = req.params.id;
  try {
    const foundCategory = await Category.findById(
      categoryId,
      categoryProjection
    ).populate(populateCategory(1, "parentCategory"));
    // TODO check if `isDeleted` is true
    res.status(HttpStatus.OK).json({
      success: true,
      data: foundCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Find all categories
export const getCategories: RequestHandler = async (req, res, next) => {
  try {
    const foundCategories = await Category.find(
      { isDeleted: { $ne: true } },
      categoryProjection
    ).populate(populateCategory(1, "parentCategory"));
    res.status(HttpStatus.OK).json({
      success: true,
      data: foundCategories,
    });
  } catch (error) {
    next(error);
  }
};

export const postCategory: RequestHandler<
  any,
  any,
  UpdateCategoryType
> = async (req, res, next) => {
  try {
    // TODO check if name already in use

    const createdCategory = await Category.create(req.body);
    res.status(HttpStatus.CREATED).json({
      success: true,
      data: createdCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory: RequestHandler<{ id: string }> = async (
  req,
  res,
  next
) => {
  const categoryId = req.params.id;
  try {
    // const result = await Category.findByIdAndDelete(categoryId);

    // soft deletion
    await Category.findByIdAndUpdate(categoryId, {
      isDeleted: true,
      isActive: false,
    });
    res.status(HttpStatus.OK).json({
      success: true,
      message: "Category Deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  const categoryId = req.params.id;
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      req.body
    );
    res.status(HttpStatus.OK).json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};
