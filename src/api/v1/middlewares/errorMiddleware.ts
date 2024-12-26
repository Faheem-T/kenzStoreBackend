import { NextFunction, Request, Response } from "express-serve-static-core";
import mongoose from "mongoose";
import { ZodError } from "zod";

export const errorHandlingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    res.status(500).json({
      success: false,
      name: error.name,
      issues: error.issues
    })
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(500).json({
      success:false,
      name: error.name,
      errors: error.errors,
      message: error.message
    })
    console.log("MONGOOSE ERROR")
    console.log(error)
  }

  res.status(500).json({
    success: false,
    name: error.name,
    message: error.message,
  });
  console.error(error);
};
