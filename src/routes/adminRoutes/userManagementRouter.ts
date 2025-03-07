import { Router } from "express";
import {
  getUsers,
  getUser,
  patchToggleBlockUser,
  purgeUser,
} from "../../controllers/userManagementController";

// v1/admin/users
export const userManagementRouter = Router()
  .get("/", getUsers)
  .get("/:userId", getUser)
  .patch("/:userId/block", patchToggleBlockUser)
  .delete("/:userId", purgeUser);
