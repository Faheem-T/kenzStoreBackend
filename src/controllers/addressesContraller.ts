import { Address } from "../models/addressModel";
import { AuthenticatedRequestHandler } from "../types/authenticatedRequest";

// GET addresses/user
export const getUserAddresses: AuthenticatedRequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  if (!userId) {
    res.status(400).json({
      success: false,
      message: "User ID is required",
    });
    return;
  }
  try {
    const foundAddress = await Address.find({ userId });
    if (!foundAddress) {
      res.status(400).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: foundAddress,
    });
  } catch (error) {
    next(error);
  }
};

// POST addresses/user
export const postUserAddress: AuthenticatedRequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  if (!userId) {
    res.status(400).json({
      success: false,
      message: "User ID is required",
    });
    return;
  }
  try {
    const createdAddress = await Address.create({ ...req.body, userId });
    res.status(201).json({
      success: true,
      message: "Address created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH addresses/:addressId/setDefault
export const setDefaultAddress: AuthenticatedRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  const userId = req.userId as string;
  if (!addressId) {
    res.status(400).json({
      success: false,
      message: "Address ID is required",
    });
    return;
  }
  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      {
        isDefault: true,
      }
    );
    if (!updatedAddress) {
      res.status(400).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Address set as default successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH addresses/:addressId
export const updateAddress: AuthenticatedRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  const userId = req.userId;
  if (!addressId) {
    res.status(400).json({
      success: false,
      message: "Address ID is required",
    });
    return;
  }
  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      req.body
    );
    if (!updatedAddress) {
      res.status(400).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Address updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE addresses/:addressId
export const deleteAddress: AuthenticatedRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  if (!addressId) {
    res.status(400).json({
      success: false,
      message: "Address ID is required",
    });
    return;
  }
  const userId = req.userId as string;

  try {
    const deletedAddress = await Address.findOneAndDelete({
      _id: addressId,
      userId,
    });
    if (!deletedAddress) {
      res.status(400).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    console.log("Deleted Address: ", deletedAddress);
    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
