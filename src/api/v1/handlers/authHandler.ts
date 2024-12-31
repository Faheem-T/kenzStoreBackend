import { RequestHandler } from "express-serve-static-core";
import { User } from "../models/userModel";
import { hashPassword, validatePassword } from "../../helpers/hashHelper";
import { registerBodyType } from "../types/registerSchema";
import { loginBodyType } from "../types/loginSchema";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../helpers/jwtHelper";
import { RefreshToken } from "../models/refreshTokenModel";

export const get_me: RequestHandler = (req, res) => {
  res.send("hello from handler!!");
};

export const postRegister: RequestHandler<any, any, registerBodyType> = async (
  req,
  res,
  next
) => {
  try {
    req.body.password = hashPassword(req.body.password);
  } catch (error) {
    return next(error);
  }

  let newUser;
  try {
    newUser = await User.create(req.body);
  } catch (error: any) {
    return next(error);
  }

  res.status(201).json({
    success: true,
    data: newUser,
  });
};

export const postLogin: RequestHandler<any, any, loginBodyType> = async (
  req,
  res,
  next
) => {
  try {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ email }).exec();

    console.log(foundUser);

    // Check if email exists
    if (!foundUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // check if password is correct
    if (!validatePassword(password, foundUser.password)) {
      res.status(400).json({
        success: false,
        message: "Wrong password",
      });
      return;
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken(foundUser.email, foundUser.id);
    // Adding refresh token to database
    try {
      await RefreshToken.create({ refreshToken, userId: foundUser._id });
    } catch (error) {
      next(error);
      return;
    }

    // generate access token
    const accessToken = generateAccessToken(foundUser.email, foundUser.id);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      .status(200)
      .json({
        success: true,
        data: {
          accessToken,
          user: {
            firstName: foundUser.firstName,
            email: foundUser.email,
          },
        },
      });
  } catch (error) {
    next(error);
  }
};
