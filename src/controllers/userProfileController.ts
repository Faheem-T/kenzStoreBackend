import { HttpStatus } from "../utils/httpenum";
import { RequestHandler } from "express";
import { User } from "../models/userModel";

export const handlePatchUserProfile: RequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.params.userId;
  console.log(userId);
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
    });
    if (!updatedUser) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};
