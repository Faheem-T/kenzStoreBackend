import { RequestHandler } from "express";
import { Product } from "../models/productModel";
import { populateCategories } from "../helpers/populateCategoriesHelper";

// Fields to be included when sending
const productProjection = {
    name: 1,
    description: 1,
    price: 1,
    images: 1,
    categories: 1,
    specifications: 1,
    stock: 1,
    isHero: 1
}

export const getProduct: RequestHandler<{ id: string }> = async (req, res, next) => {
    const productId = req.params.id
    console.log(productId)
    try {
        const foundProduct = await Product.findById(productId, productProjection).populate(populateCategories())
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

// get all products
export const getProducts: RequestHandler = async (req, res, next) => {
    try {
        const foundProducts = await Product
            .find({}, productProjection)
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
