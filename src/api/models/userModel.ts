import mongoose from "mongoose";
import { UserType } from "../types/user";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: { type: String },
    email: { type: String, required: true },
    DOB: { type: Date },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

export type IUser = UserType & mongoose.Document;

export const User = mongoose.model<IUser>("User", userSchema);
