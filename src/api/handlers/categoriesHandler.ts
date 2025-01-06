import { RequestHandler } from "express";
import { Category } from "../models/categoryModel";
import { postCategoryRequestBodyType } from "../types/requestBodyTypes";

const categoryProjection = {
    name: 1,
    parentCategory: 1,
    listed: 1,
    createdAt: 1,
    updatedAt: 1
}

export const getCategory: RequestHandler<{ id: string }> = async (req, res, next) => {
    const categoryId = req.params.id
    try {
        const foundCategory = await Category.findById(categoryId, categoryProjection)
        res.status(200).json({
            success: true,
            data: foundCategory
        })

    } catch (error) {
        next(error)
    }
}

export const getCategories: RequestHandler = async (req, res, next) => {
    try {
        const foundCategories = await Category.find({}, categoryProjection)
        res.status(200).json({
            success: true,
            data: foundCategories
        })
    } catch (error) {
        next(error)
    }
}

export const postCategory: RequestHandler<void, any, postCategoryRequestBodyType> = async (req, res, next) => {
    const { name, parentCategory } = req.body

    try {

        // TODO check if name already in use

        const createdCategory = await Category.create({ name, parentCategory })
        res.status(201).json({
            success: true,
            data: createdCategory
        })
    } catch (error) {
        next(error)
    }
}

export const deleteCategory: RequestHandler<{ id: string }> = async (req, res, next) => {
    const categoryId = req.params.id
    try {
        const result = await Category.findByIdAndDelete(categoryId)
        console.log("Deleted Category", result)
        res.status(200).json({
            success: true,
            message: "Category Deleted"
        })
    } catch (error) {
        next(error)
    }
}

export const updateCategory: RequestHandler = async (req, res, next) => {
    const categoryId = req.params.id
    try {
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body)
        res.status(200).json({
            success: true,
            data: updatedCategory
        })
    } catch (error) {
        next(error)
    }

}
