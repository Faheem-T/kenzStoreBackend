import { verifyAdminAccessToken } from "../utils/jwtHelper";
import { AdminRequestHandler } from "../types/authenticatedRequest";

export const adminAccessMiddleware: AdminRequestHandler = (req, res, next) => {
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
    res.status(401).json({
      success: false,
      message: "Invalid/Expired access token",
    });
  }
};
