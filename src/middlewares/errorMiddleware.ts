import { HttpStatus } from "../utils/httpenum";
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
    const issues = error.issues.map((issue) => ({
      message: issue.message,
      field: issue.path[0],
    }));
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      name: error.name,
      issues,
    });
    console.log(error);
    console.log(error.issues);
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      name: error.name,
      errors: error.errors,
      message: error.message,
    });
    console.log("MONGOOSE ERROR");
    console.log(error);
    return;
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    name: error.name,
    message: error.message,
  });
  console.error(error);
};
