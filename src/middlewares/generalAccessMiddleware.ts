import { RequestHandler } from "express";
import { GeneralRequestHandler } from "../types/authenticatedRequest";
import { HttpStatus } from "../utils/httpenum";
import {
  verifyAccessToken,
  verifyAdminAccessToken,
} from "../utils/authJwtHelper";

export const generalAccessMiddleware: GeneralRequestHandler = async (
  req,
  res,
  next
) => {
  const accessToken = req.header("authorization")?.split(" ")[1];
  if (!accessToken) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Access Token not found.",
    });
    return;
  }
  // Check if user
  const decoded = verifyAccessToken(accessToken);
  if (decoded) {
    req.userId = decoded.userId;
    next();
    return;
  }
  // Check if admin
  const adminDecoded = verifyAdminAccessToken(accessToken);
  if (adminDecoded) {
    req.adminId = adminDecoded.adminId;
    next();
    return;
  }

  res.status(HttpStatus.UNAUTHORIZED).json({
    success: false,
    message: "Invalid/Expired access token",
  });
};
