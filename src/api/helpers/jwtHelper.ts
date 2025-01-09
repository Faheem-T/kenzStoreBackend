import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// doing this so that the decoded object will be recognized by TS
// source: https://stackoverflow.com/questions/68403905/how-to-add-additional-properties-to-jwtpayload-type-from-types-jsonwebtoken
declare module 'jsonwebtoken' {
  export interface UserIDJwtPayload extends jwt.JwtPayload {
    userId: string
  }
  export interface AdminIDJwtPayload extends jwt.JwtPayload {
    adminId: string
  }
}

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const ADMIN_REFRESH_SECRET = process.env.JWT_ADMIN_REFRESH_SECRET;
const ADMIN_ACCESS_SECRET = process.env.JWT_ADMIN_ACCESS_SECRET;

export const REFRESH_MAX_AGE = 60 * 60 * 24 // 24 hours
export const ACCESS_MAX_AGE = 60 * 5 // 5 minutes

if (!REFRESH_SECRET || !ACCESS_SECRET || !ADMIN_ACCESS_SECRET || !ADMIN_REFRESH_SECRET) {
  throw new Error(
    "Refresh/Access secret not found (Please set it in your .env)"
  );
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_MAX_AGE });
};

export const verifyRefreshToken = (refreshToken: string) => {
  let decoded = null;
  try {
    decoded = <jwt.UserIDJwtPayload>jwt.verify(refreshToken, REFRESH_SECRET)
  } catch (error) {
    console.log("user refresh verification error: \n", error)
  }
  return decoded
}

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_MAX_AGE });
};



// Admin jwt logic

export const generateAdminRefreshToken = (adminId: string) => {
  return jwt.sign({ adminId }, ADMIN_REFRESH_SECRET, { expiresIn: REFRESH_MAX_AGE })
}

export const verifyAdminRefreshToken = (refreshToken: string) => {
  let decoded = null;
  try {
    decoded = <jwt.AdminIDJwtPayload>jwt.verify(refreshToken, ADMIN_REFRESH_SECRET)
  } catch (error) {
    console.log("Admin refresh token verification error: ", error);
  }
  return decoded
}

export const generateAdminAccessToken = (adminId: string) => {
  return jwt.sign({ adminId }, ADMIN_ACCESS_SECRET, { expiresIn: ACCESS_MAX_AGE })
}

export const verifyAdminAccessToken = (accessToken: string) => {
  let decoded = null;
  try {
    decoded = <jwt.AdminIDJwtPayload>jwt.verify(accessToken, ADMIN_ACCESS_SECRET)
  } catch (error) {
    console.log("Admin access token verification error: ", error)
  }
  return decoded
}
