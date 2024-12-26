import { RequestHandler } from "express-serve-static-core";
import { User, userZodSchema } from "../models/userModel";
import { Error } from "mongoose";
import { hashPassword } from "../../helpers/hashHelper";

export const get_me: RequestHandler = (req, res) => {
  res.send("hello from handler!!");
};


export interface registerBody {
  firstName: string,
  lastName: string,
  email: string,
  DOB: Date,
  password: string
}

export const postRegister: RequestHandler<any, any, registerBody> = async (req, res, next) => {
  req.body.DOB = new Date(req.body.DOB)
  // hashing password
  try {
    req.body.password = hashPassword(req.body.password)
  } catch (error) {
    return next(error)
  }

  // checking if email is already in use
  const foundUser = await User.findOne({email: req.body.email})
  if (foundUser) {
    return next(new Error("Email is already in use!"))
  }

  let newUser;
  try {
    newUser = await User.create(req.body)
  } catch (error: any) {
    return next(error)
  }

  res.send(newUser)
}
