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
  decodeForgotPasswordJWT,
  generateAccessToken,
  generateAdminAccessToken,
  generateForgotPasswordJWT,
  generateRefreshToken,
  REFRESH_MAX_AGE,
  verifyAdminRefreshToken,
  verifyRefreshToken,
} from "../utils/authJwtHelper";
import { Admin } from "../models/adminModel";
import {
  generateOtp,
  sendOTPtoMail,
  sendPasswordResetLinktoEmail,
} from "../utils/nodeMailer";
import { OTP } from "../models/otpModel";
import { generateReferralCode } from "../utils/generateReferralCode";
import { Wallet } from "../models/walletModel";

const REFERRAL_REWARD_AMOUNT = 200;

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
  if (!decoded) {
    // checking if admin
    decoded = verifyAdminRefreshToken(refreshToken);
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
            _id: foundUser._id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            id: foundUser.id,
            referralCode: foundUser.referralCode,
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

  const { email, firstName, password, referralCode } = req.body;

  let referredByUser;
  if (referralCode) {
    referredByUser = await User.findOne({
      referralCode: referralCode.toUpperCase(),
    });
    if (!referredByUser) {
      res.status(400).json({
        success: false,
        issues: [{ field: "referralCode", message: "Invalid referral code" }],
      });
      return;
    }
  }

  const newReferralCode = generateReferralCode();

  try {
    await User.create({
      firstName,
      email,
      password,
      referredBy: referredByUser ? referredByUser._id : null,
      referralCode: newReferralCode,
    });
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

    if (
      validateOtp(otp, foundOtp.otp) &&
      foundOtp.expiresAt > new Date() // make sure otp has not expired
    ) {
      // change verified to true on user object
      const foundUser = await User.findOne({
        email,
        expiresAt: { $gt: new Date(Date.now()) },
      });
      // make sure user has not expired
      if (!foundUser) {
        res.status(400).json({
          success: false,
          message: "Registration time exceeded. Please register again.",
        });
        return;
      }

      foundUser.isVerified = true;
      foundUser.expiresAt = null;
      await foundUser.save();

      // Check for referral and update wallet for referrer and this user
      if (foundUser.referredBy) {
        const date = new Date();

        let referredByUserWallet = await Wallet.findOne({
          user: foundUser.referredBy,
        });
        if (!referredByUserWallet) {
          referredByUserWallet = new Wallet({ user: foundUser.referredBy });
        }
        referredByUserWallet.balance += REFERRAL_REWARD_AMOUNT;
        referredByUserWallet.history = [
          ...referredByUserWallet.history,
          {
            amount: REFERRAL_REWARD_AMOUNT,
            timestamp: date,
            logType: "referral reward",
            notes: `Referred ${foundUser._id}`,
          },
        ];
        await referredByUserWallet.save();

        let userWallet = await Wallet.findOne({ user: foundUser._id });
        if (!userWallet) {
          userWallet = new Wallet({ user: foundUser._id });
        }
        userWallet.balance += REFERRAL_REWARD_AMOUNT;
        userWallet.history = [
          ...userWallet.history,
          {
            amount: REFERRAL_REWARD_AMOUNT,
            timestamp: date,
            logType: "referral reward",
            notes: `Got referred by ${foundUser.referredBy}`,
          },
        ];
        await userWallet.save();
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
            referralCode: foundUser.referralCode,
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

// forgot password route
export const postForgotPassword: RequestHandler = async (req, res, next) => {
  const { email } = req.body;
  try {
    const foundUser = await User.findOne({ email }).exec();
    if (!foundUser) {
      res.status(400).json({
        success: false,
        message: "Email not found",
      });
      return;
    }

    const token = generateForgotPasswordJWT(email);
    sendPasswordResetLinktoEmail(email, token);

    res.status(200).json({
      success: true,
      message: "Password reset mail has been sent",
    });
  } catch (error) {
    next(error);
  }
};

export const postResetPassword: RequestHandler = async (req, res, next) => {
  const { newPassword, token } = req.body;
  if (!newPassword) {
    res.status(400).json({
      success: false,
      message: "New password is required",
    });
  }
  if (!token) {
    res.status(400).json({
      success: false,
      message: "Token not found",
    });
    return;
  }

  const decoded = decodeForgotPasswordJWT(token);
  if (!decoded) {
    res.status(400).json({
      success: false,
      message: "Invalid token. Please try again.",
    });
    return;
  }

  const { email } = decoded;
  const hashedPassword = hashPassword(newPassword);
  try {
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    res.status(200).json({
      success: true,
      message: "Password has been reset successfully!",
    });
  } catch (error) {
    next(error);
  }
};
