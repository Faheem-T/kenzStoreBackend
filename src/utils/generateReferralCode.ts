import * as crypto from "node:crypto";

export const generateReferralCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};
