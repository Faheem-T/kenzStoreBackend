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
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};
