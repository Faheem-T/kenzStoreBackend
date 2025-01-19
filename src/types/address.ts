import mongoose from "mongoose";

export interface AddressType {
  userId: mongoose.Types.ObjectId;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}
