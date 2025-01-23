import mongoose from "mongoose";

// SHARED TYPE: Sync with frontend
export interface AddressType {
  _id: string;
  userId: mongoose.Types.ObjectId;
  address_line: string;
  city: string;
  state: string;
  pincode: number;
  landmark?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
