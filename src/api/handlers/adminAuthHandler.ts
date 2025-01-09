import { RequestHandler } from "express";
import { AdminType } from "../types/admin";
import { Admin } from "../models/adminModel";
import { hashPassword, validatePassword } from "../helpers/hashHelper";
import { generateAdminAccessToken, generateAdminRefreshToken, REFRESH_MAX_AGE, verifyAdminRefreshToken } from "../helpers/jwtHelper";

export const postAdminLogin: RequestHandler<void, any, AdminType> = async (req, res, next) => {
    const { password, username } = req.body
    try {
        const foundAdmin = await Admin.findOne({ username }).exec();

        if (!foundAdmin) {
            res.status(404).json({
                success: false,
                message: "Invalid Username"
            })
            return
        }

        if (!validatePassword(password, foundAdmin.password)) {
            res.status(400).json({
                success: false,
                message: "Wrong password!"
            })
            return
        }

        const refreshToken = generateAdminRefreshToken(foundAdmin.id);
        const accessToken = generateAdminAccessToken(foundAdmin.id);


        console.log("REFRESH max: ", REFRESH_MAX_AGE)

        res
            .status(200)
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: REFRESH_MAX_AGE * 1000 // since maxAge considers the values as milliseconds
            })
            .json({
                success: true,
                data: {
                    admin: { id: foundAdmin.id, username: foundAdmin.username },
                    accessToken,
                }
            })



    } catch (error) {
        next(error)
    }
}

export const postCreateAdmin: RequestHandler<void, any, AdminType> = async (req, res, next) => {
    req.body.password = hashPassword(req.body.password);
    try {
        const createdAdmin = await Admin.create({ ...req.body });
        res.status(201).json({
            success: true,
            data: createdAdmin
        })
    } catch (error) {
        next(error)
    }
}

export const getAdminRefresh: RequestHandler = (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        res.status(400).json({
            success: false,
            message: "Refresh token not found",
        });
        console.log("refresh token not found");
        return;
    }
    const decoded = verifyAdminRefreshToken(refreshToken)
    if (!decoded) {
        res.status(400).json({
            success: false,
            message: "Invalid refresh token"
        })
        return;
    }

    // generate new access token using decoded id
    const { adminId } = decoded
    const accessToken = generateAdminAccessToken(adminId);
    res.status(200).json({
        success: "true",
        data: accessToken
    })
}
