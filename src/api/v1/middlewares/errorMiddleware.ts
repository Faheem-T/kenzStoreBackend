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
    const issues = error.issues.map((issue) => ({message: issue.message, field: issue.path[0]}))
    res.status(400).json({
      success: false,
      name: error.name,
      issues
    })
    console.log(error)
    console.log(error.issues)
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(500).json({
      success: false,
      name: error.name,
      errors: error.errors,
      message: error.message
    })
    console.log("MONGOOSE ERROR")
    console.log(error)
    return;
  }

  res.status(500).json({
    success: false,
    name: error.name,
    message: error.message,
  });
  console.error(error);
};
