import { RequestHandler } from "express-serve-static-core";
import { User } from "../models/userModel";
import { hashPassword, validatePassword } from "../helpers/hashHelper";
import { registerBodyType } from "../types/registerSchema";
import { loginBodyType } from "../types/loginSchema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../helpers/jwtHelper";
import { RefreshToken } from "../models/refreshTokenModel";

export const getMe: RequestHandler = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: "Refresh token not found",
    });
    return;
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    res.status(400).json({
      success: false,
      message: "Invalid refresh token",
    });
    return;
  }

  const { userId } = decoded;

  // generate access token
  const accessToken = generateAccessToken(userId);

  // try to get user from DB
  try {
    const foundUser = await User.findById(userId, { password: 0 });
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: foundUser,
      },
    });
  } catch (error) {
    next(error);
    return;
  }
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
    const refreshToken = generateRefreshToken(foundUser.id);
    // Decided not to use refresh token collection as Hariprasad (Reviewer)
    // said that is not necessary

    // Adding refresh token to database
    // try {
    //   await RefreshToken.create({ refreshToken, userId: foundUser._id });
    // } catch (error) {
    //   next(error);
    //   return;
    // }

    // generate access token
    const accessToken = generateAccessToken(foundUser.id);

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

// Refresh route
export const getRefresh: RequestHandler = (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: "Refresh token not found",
    });
    console.log("refresh token not found");
    return;
  }
  const decoded = verifyRefreshToken(refreshToken);
  if (decoded) {
    const accessToken = generateAccessToken(decoded.userId);
    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } else {
    res.status(400).send();
  }
};

// logout route
export const postLogout: RequestHandler = (req, res) => {
  res.clearCookie("refreshToken", {path: "/"}).status(200).json({
    success: true,
    message: "Logged out successfully"
  })
}
