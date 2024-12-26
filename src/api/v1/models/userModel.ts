import e from "cors";
import mongoose from "mongoose";
import { z } from "zod";

// export interface IUser extends mongoose.Document {
//   firstName: string,
//   lastName: string,
//   email: string,
//   DOB: Date,
//   password: string
// }

export const userZodSchema = z.object({
  firstName: z.string().nonempty({ message: "First name is required" }).min(3, { message: "Name cannot be less than 3 characters" }),
  lastName: z.string().nonempty({ message: "Last name is required" }),
  email: z.string().nonempty({ message: "Email is required" }).email({ message: "Email format is not valid" }),
  DOB: z.date(),
  password: z.string().nonempty({ message: "Password is required" }).min(5, { message: "Password cannot be less than 5 characters" })
})

export type UserType = z.infer<typeof userZodSchema> & mongoose.Document

const FIRST_NAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 6;

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    minLength: [
      FIRST_NAME_MIN_LENGTH,
      `First name cannot contain less than ${FIRST_NAME_MIN_LENGTH} characters`
    ],
  },
  lastName: { type: String },
  email: { type: String, required: true },
  DOB: { type: Date },
  password: {
    type: String,
    minLength: [
      PASSWORD_MIN_LENGTH,
      `Password must be atleast ${PASSWORD_MIN_LENGTH} characters long`
    ],
  },
})


export const User = mongoose.model<UserType>('User', userSchema);
