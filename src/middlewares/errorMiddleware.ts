import { NextFunction, Request, Response } from "express-serve-static-core";

export const errorHandlingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(500).json({
    name: error.name,
    message: error.message,
  });
  console.error(error);
};
