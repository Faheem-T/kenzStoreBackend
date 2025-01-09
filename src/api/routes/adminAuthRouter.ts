import { Router } from "express";
import { getAdminRefresh, postAdminLogin, postCreateAdmin } from "../handlers/adminAuthHandler";

export const adminAuthRouter = Router()
    .post("/", postCreateAdmin)
    .post("/login", postAdminLogin)
    .get("/refresh", getAdminRefresh)
