import { HttpStatus } from "../utils/httpenum";
import { RequestHandler } from "express";
import { User } from "../models/userModel";

const userProjection = {
  password: 0,
};

// Get all users
export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    const foundUsers = await User.find({}, userProjection);
    if (!foundUsers) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Users not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      data: foundUsers,
    });
  } catch (error) {
    next(error);
  }
};
// Get one user
export const getUser: RequestHandler<{ userId: string }> = async (
  req,
  res,
  next
) => {
  const userId = req.params.userId;
  try {
    const foundUser = await User.findById(userId, userProjection);
    if (!foundUser) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      data: foundUser,
    });
  } catch (error) {
    next(error);
  }
};

// Block user
export const patchToggleBlockUser: RequestHandler<{ userId: string }> = async (
  req,
  res,
  next
) => {
  const userId = req.params.userId;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      [
        {
          $set: { isBlocked: { $not: "$isBlocked" } }, // toggles the isBlocked field
        },
      ],
      { new: true, projection: userProjection }
    );
    if (!updatedUser) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    let message = "User unblocked successfully";
    if (updatedUser.isBlocked) {
      message = "User blocked successfully";
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
