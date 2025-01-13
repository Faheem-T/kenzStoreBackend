import { RequestHandler } from "express";
import { verifyAdminAccessToken } from "../utils/jwtHelper";

export const adminAccessMiddleware: RequestHandler = (req, res, next) => {
  console.log(req.headers);
  const accessToken = req.header("authorization")?.split(" ")[1];
  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Access Token not found.",
    });
    return;
  }
  if (verifyAdminAccessToken(accessToken)) {
    next();
  }
};
