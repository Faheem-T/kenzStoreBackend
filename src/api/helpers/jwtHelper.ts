import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!REFRESH_SECRET || !ACCESS_SECRET) {
  throw new Error(
    "Refresh/Access secret not found (Please set it in your .env)"
  );
}

export const generateRefreshToken = (email: string, userId: string) => {
  return jwt.sign({ email, userId }, REFRESH_SECRET);
};

export const generateAccessToken = (email: string, userId: string) => {
  return jwt.sign({ email, userId }, ACCESS_SECRET);
};
