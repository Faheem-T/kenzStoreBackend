import { RequestHandler } from "express-serve-static-core";
import { User } from "../models/userModel";
import {
  hashOtp,
  hashPassword,
  validateOtp,
  validatePassword,
} from "../utils/hashHelper";
import { registerBodyType } from "../types/registerSchema";
import { loginBodyType } from "../types/loginSchema";
import {
  generateAccessToken,
  generateAdminAccessToken,
  generateRefreshToken,
  REFRESH_MAX_AGE,
  verifyAdminRefreshToken,
  verifyRefreshToken,
} from "../utils/jwtHelper";
import { Admin } from "../models/adminModel";
import { generateOtp, sendOTPtoMail } from "../utils/nodeMailer";
import { OTP } from "../models/otpModel";

export const getMe: RequestHandler = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: "Refresh token not found",
    });
    return;
  }

  let isAdmin = false;
  let id;
  let decoded;
  decoded = verifyRefreshToken(refreshToken);
  console.log("Refresh Token", refreshToken);
  console.log("Decoded: ", decoded);
  if (!decoded) {
    // checking if admin
    decoded = verifyAdminRefreshToken(refreshToken);
    console.log("admin Decoded:", decoded);
    if (!decoded) {
      res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
      return;
    }

    id = decoded.adminId;
    isAdmin = true;
  } else {
    id = decoded.userId;
  }

  // try to get user from DB
  try {
    if (!isAdmin) {
      // generate access token
      const accessToken = generateAccessToken(id);
      const foundUser = await User.findById(id, { password: 0 });
      if (!foundUser) {
        res.status(400).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          user: {
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            id: foundUser.id,
          },
          isAdmin: false,
        },
      });
    } else {
      // generate admin access token
      const accessToken = generateAdminAccessToken(id);
      const foundAdmin = await Admin.findById(id, { password: 0 });
      if (!foundAdmin) {
        res.status(400).json({
          success: false,
          message: "Admin not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          user: {
            id: foundAdmin.id,
            username: foundAdmin.username,
          },
          isAdmin: true,
        },
      });
    }
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

  const otp = generateOtp();

  // save otp to database
  try {
    const hashedOtp = hashOtp(otp);
    await OTP.create({ otp: hashedOtp, email: req.body.email });
  } catch (error) {
    return next(error);
  }

  sendOTPtoMail(req.body.email, otp);

  res.status(201).json({
    success: true,
    message: "An OTP has been sent to your email",
  });
};

export const postVerifyOtp: RequestHandler = async (req, res, next) => {
  const { otp, email } = req.body;

  try {
    const foundOtp = await OTP.findOneAndDelete({ email }) // Deleting the OTP after finding it
      .sort({ createdAt: -1 })
      .exec();
    if (!foundOtp) {
      res.status(400).json({
        success: false,
        message: "Wrong email",
      });
      return;
    }

    console.log("Is OTP expired: ", !(foundOtp.expiresAt > new Date()));

    if (
      validateOtp(otp, foundOtp.otp) &&
      foundOtp.expiresAt > new Date() // make sure otp has not expired
    ) {
      // change verified to true on user object
      const updatedUser = await User.findOneAndUpdate(
        { email, expiresAt: { $gt: new Date(Date.now()) } },
        { isVerified: true, expiresAt: null }
      );
      // make sure user has not expired
      if (!updatedUser) {
        res.status(400).json({
          success: false,
          message: "Registration time exceeded. Please register again.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Email has been verified successfully! You may Log In now.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid or Expired OTP",
      });
    }
  } catch (error) {
    next(error);
  }
};

// TODO: Implement Rate limiting for this route when hosting
export const postResendOtp: RequestHandler = async (req, res, next) => {
  const { email } = req.body;

  // make sure user is supposed to get an otp
  // isVerified = false
  const foundUser = await User.findOne({ email }).exec();
  if (!foundUser) {
    res.status(399).json({
      success: false,
      message: "Email not found",
    });
    return;
  }
  if (foundUser.isVerified) {
    res.status(399).json({
      success: false,
      message: "User is already verified",
    });
    return;
  }
  try {
    // delete previous OTP
    await OTP.findOneAndDelete({ email });

    // generate new OTP
    const otp = generateOtp();
    // hash otp
    const hashedOtp = hashOtp(otp);
    // save to database
    await OTP.create({ email, otp: hashedOtp });
    // send otp to users email
    sendOTPtoMail(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP has been resent",
    });
  } catch (error) {
    next(error);
  }
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

    // check if user has been verified
    if (!foundUser.isVerified) {
      res.status(400).json({
        success: false,
        message: "Your email has not been verified.",
      });
      return;
    }

    // check if user has been blocked
    if (foundUser.isBlocked) {
      res.status(400).json({
        success: false,
        message: "You are currently blocked",
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
        maxAge: REFRESH_MAX_AGE * 1000, // since maxAge considers the values as milliseconds
      })
      .status(200)
      .json({
        success: true,
        data: {
          accessToken,
          user: {
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            id: foundUser._id,
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
  res.clearCookie("refreshToken", { path: "/" }).status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
