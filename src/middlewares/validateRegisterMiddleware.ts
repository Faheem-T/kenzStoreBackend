import { RequestHandler } from "express-serve-static-core";
import { z } from "zod";
import { User } from "../models/userModel";
import { registerBodySchema, registerBodyType } from "../types/registerSchema";

export const validateRegisterMiddleware: RequestHandler<
  any,
  any,
  registerBodyType
> = async (req, res, next) => {
  try {
    registerBodySchema.parse(req.body);

    const { password, confirmPassword, email } = req.body;

    // check confirmation password
    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        name: "validationError",
        issues: [
          {
            field: "confirmPassword",
            message: "Confirmation password does not match",
          },
        ],
      });
      return;
    }

    // check if email is already in use and that it is verified
    const foundUser = await User.findOne({ email, isVerified: true });
    if (foundUser) {
      res.status(400).json({
        success: false,
        name: "validationError",
        issues: [{ field: "email", message: "Email is already in use!" }],
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
