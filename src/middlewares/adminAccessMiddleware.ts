import { HttpStatus } from "../utils/httpenum";
import { verifyAdminAccessToken } from "../utils/authJwtHelper";
import { AdminRequestHandler } from "../types/authenticatedRequest";

export const adminAccessMiddleware: AdminRequestHandler = (req, res, next) => {
  const accessToken = req.header("authorization")?.split(" ")[1];
  if (!accessToken) {
    res.status(HttpStatus.BAD_REQUEST).json({
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
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Invalid/Expired access token",
    });
  }
};
