import { Router } from "express";
import { handlePatchUserProfile } from "../../controllers/userProfileController";

// v1/users/
export const userProfileRouter = Router().patch(
  "/:userId/profile",
  handlePatchUserProfile
);
