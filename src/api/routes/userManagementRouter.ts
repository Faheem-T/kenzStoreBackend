import { Router } from "express";
import {
  getUsers,
  getUser,
  patchToggleBlockUser,
} from "../handlers/userManagementHandler";

export const userManagementRouter = Router()
  .get("/", getUsers)
  .get("/:userId", getUser)
  .patch("/:userId/block", patchToggleBlockUser);
