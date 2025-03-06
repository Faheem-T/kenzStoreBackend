import { Address } from "../models/addressModel";
import { UserRequestHandler } from "../types/authenticatedRequest";
import { AddressType } from "../types/address";
import { BaseResponse } from "../types/baseResponse";
import { HttpStatus } from "../utils/httpenum";

// GET addresses/user
interface getUserResBody extends BaseResponse<AddressType[]> {}

export const getUserAddresses: UserRequestHandler<{}, getUserResBody> = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  if (!userId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "User ID is required",
    });
    return;
  }
  try {
    const foundAddress = await Address.find({ userId });
    if (!foundAddress) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      data: foundAddress,
    });
  } catch (error) {
    next(error);
  }
};

// POST addresses/user
export const postUserAddress: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }
  try {
    const createdAddress = await Address.create({ ...req.body, userId });
    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Address created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH addresses/:addressId/setDefault
export const setDefaultAddress: UserRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  const userId = req.userId as string;
  if (!addressId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "Address ID is required",
    });
    return;
  }
  try {
    // set 'isDefault: false' for all other addresses and set this one as default
    await Address.updateMany(
      {
        userId,
        _id: { $ne: addressId },
      },
      {
        isDefault: false,
      }
    );
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      {
        isDefault: true,
      }
    );
    if (!updatedAddress) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      message: "Address set as default successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PATCH addresses/:addressId
export const updateAddress: UserRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  const userId = req.userId;
  if (!addressId) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "Address ID is required",
    });
    return;
  }
  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      req.body,
      { new: true }
    );
    if (!updatedAddress) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Address not found",
      });
      return;
    }
    res.status(HttpStatus.OK).json({
      success: true,
      message: "Address updated successfully",
    });
    console.log("Updated address: \n", updatedAddress);
  } catch (error) {
    next(error);
  }
};

// DELETE addresses/:addressId
export const deleteAddress: UserRequestHandler<{
  addressId: string;
}> = async (req, res, next) => {
  const addressId = req.params.addressId;
  if (!addressId) {
    res.status(HttpStatus.BAD_REQUEST).json({
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
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    console.log("Deleted Address: ", deletedAddress);
    res.status(HttpStatus.OK).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
