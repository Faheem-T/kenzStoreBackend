import { HttpStatus } from "../utils/httpenum";
import { UserRequestHandler } from "../types/authenticatedRequest";
import { verifyAccessToken } from "../utils/authJwtHelper";

export const userAccessMiddleware: UserRequestHandler = async (
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
  const decoded = verifyAccessToken(accessToken);
  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Invalid/Expired access token",
    });
  }
};
