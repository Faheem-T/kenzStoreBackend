import { RequestHandler } from "express";
import { verifyAdminAccessToken } from "../../utils/authJwtHelper";

export const adminAccessMiddleware: RequestHandler = (req, res, next) => {
  console.log(req.headers);
  const accessToken = req.header("authorization")?.split(" ")[1];
  console.log(accessToken);
  if (!accessToken) {
    res.status(400).json({
      success: false,
      message: "Access Token not found.",
    });
    return;
  }
  const decoded = verifyAdminAccessToken(accessToken);
  if (decoded) {
    req.adminId = decoded.adminId;
    next();
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid/Expired access token",
    });
  }
};
