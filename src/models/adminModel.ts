import mongoose from "mongoose";
import { AdminType } from "../types/admin";

const AdminSchema = new mongoose.Schema<AdminType>({
    username: {
        type: String,
        required: true
    }
    ,
    password: {
        type: String,
        required: true
    }
})

export const Admin = mongoose.model("Admin", AdminSchema)
