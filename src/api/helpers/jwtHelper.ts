import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { SafeUserType } from "../types/user";
dotenv.config();

// doing this so that the decoded object will be recognized by TS
// source: https://stackoverflow.com/questions/68403905/how-to-add-additional-properties-to-jwtpayload-type-from-types-jsonwebtoken
declare module 'jsonwebtoken' {
  export interface UserIDJwtPayload extends jwt.JwtPayload {
    userId: string
  }
}

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!REFRESH_SECRET || !ACCESS_SECRET) {
  throw new Error(
    "Refresh/Access secret not found (Please set it in your .env)"
  );
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_SECRET);
};

export const verifyRefreshToken = (refreshToken: string): jwt.UserIDJwtPayload | null => {
  let decoded = null;
  try {
    decoded = <jwt.UserIDJwtPayload>jwt.verify(refreshToken, REFRESH_SECRET)
  } catch (error) {
    console.log(error)
  }
  return decoded
}

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET);
};
