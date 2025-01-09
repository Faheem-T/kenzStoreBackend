import { RequestHandler } from "express";
import { Product } from "../models/productModel";
import { populateCategories } from "../helpers/populateCategoriesHelper";
import { CreateProductType, UpdateProductType } from "../types/product";

// Fields to be included when sending
const productProjection = {
    name: 1,
    description: 1,
    price: 1,
    images: 1,
    categories: 1,
    specifications: 1,
    stock: 1,
    isHero: 1,
    discountStartDate: 1,
    discountEndDate: 1,
    discountValue: 1,
    discountType: 1
}
// get a product by its ID
export const getProduct: RequestHandler<{ id: string }> = async (req, res, next) => {
    const productId = req.params.id
    try {
        const foundProduct = await Product.findById(productId, productProjection).populate(populateCategories())
        console.log(foundProduct)
        if (foundProduct) {
            res.status(200).json({
                success: true,
                data: foundProduct
            })
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }
    } catch (error) {
        next(error)
    }
}

// create a new product
export const postProduct: RequestHandler<void, any, CreateProductType> = async (req, res, next) => {
    try {
        const createdProduct = await Product.create({ ...req.body })
        res.status(201).json({
            success: true,
            data: createdProduct
        })
    } catch (error) {
        next(error)
    }
}

// update a product
export const patchProduct: RequestHandler<{ id: string }, any, UpdateProductType> = async (req, res, next) => {
    const { id } = req.params
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, { ...req.body })
        res.status(200).json({
            success: true,
            data: updatedProduct
        })
    } catch (error) {
        next(error)
    }

}

// get all products
export const getProducts: RequestHandler<void, any, any, { page: string, sort: string, sortBy: string, limit: string, filterField: string }> = async (req, res, next) => {
    const { page = "1", sort = "asc", limit = "10", filterField, sortBy = "createdAt" } = req.query

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10)
    const sortOrder = sort === "asc" ? 1 : -1

    // Validate parsed parameters
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        res.status(400).json({
            success: false,
            message: "Invalid pagination parameters",
        });
        return;
    }

    // Whitelist of fields allowed for sorting
    const validSortFields = ["createdAt", "price", "name"]; // Update based on your schema
    if (!validSortFields.includes(sortBy)) {
        res.status(400).json({
            success: false,
            message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(", ")}`,
        });
        return
    }

    try {
        const foundProducts = await Product
            .find({})
            .sort({ [sortBy]: sortOrder })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate(populateCategories())
        if (foundProducts.length) {
            res.status(200).json({
                success: true,
                data: foundProducts,
                count: foundProducts.length
            })
        } else {
            res.status(400).json({
                success: false,
                data: [],
                message: "No products found"
            })
        }
    } catch (error) {
        next(error)
    }
}

// get all `Hero` products
export const getHeroProducts: RequestHandler = async (req, res, next) => {
    try {
        const heroProducts = await Product
            .find({ isHero: true, listed: true }, productProjection)
            .populate("categories")
        console.log(heroProducts[0].categories)
        res.status(200).json({
            success: true,
            data: heroProducts,
            count: heroProducts.length
        })
    } catch (error) {
        next(error)
    }
}

// get related products
export const getRelatedProducts: RequestHandler<{ id: string }, any, void, { limit?: string }> = async (req, res, next) => {
    const { id } = req.params
    let { limit = 5 } = req.query
    if (typeof limit === "string") {
        limit = parseInt(limit, 10)
    }

    try {
        const currentProduct = await Product.findById(id)
        if (!currentProduct) {
            res.status(404).json({
                success: false,
                message: "Product not found"
            })
            return
        }
        const relatedProducts = await Product
            .find({
                _id: { $ne: id },
                $or: [
                    { categories: { $in: currentProduct.categories } },
                    { brand: currentProduct.brand }
                ]
            }, productProjection)
            .limit(limit)
            .populate("categories")
            .exec()

        res.status(200).json({
            success: true,
            data: relatedProducts
        })

    } catch (error) {
        next(error)
    }
}
