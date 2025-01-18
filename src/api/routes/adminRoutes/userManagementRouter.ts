import { Router } from "express";
import {
  getUsers,
  getUser,
  patchToggleBlockUser,
} from "../../controllers/userManagementController";

export const userManagementRouter = Router()
  .get("/", getUsers)
  .get("/:userId", getUser)
  .patch("/:userId/block", patchToggleBlockUser);
