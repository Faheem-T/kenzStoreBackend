import mongoose from "mongoose";

export interface refreshTokenType {
  refreshToken: string;
  userId: mongoose.Types.ObjectId;
}

export const RefreshToken = mongoose.model<refreshTokenType>(
  "Refresh Token",
  new mongoose.Schema({
    refreshToken: String,
    userId: mongoose.Types.ObjectId,
  })
);
