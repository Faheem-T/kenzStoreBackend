import { AuthenticatedRequestHandler } from "../types/authenticatedRequest";
import { verifyAccessToken } from "../utils/jwtHelper";

export const userAccessMiddleware: AuthenticatedRequestHandler = async (
  req,
  res,
  next
) => {
  const accessToken = req.header("authorization")?.split(" ")[1];
  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Access Token not found.",
    });
    return;
  }
  const decoded = verifyAccessToken(accessToken);
  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid/Expired access token",
    });
  }
};
