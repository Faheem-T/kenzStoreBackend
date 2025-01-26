import { hashSync, genSaltSync, compareSync } from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): string => {
  const salt = genSaltSync(SALT_ROUNDS);
  return hashSync(password, salt);
};

export const validatePassword = (
  password: string,
  hashedPassword: string
): boolean => {
  return compareSync(password, hashedPassword);
};

export const hashOtp = (otp: number): string => {
  const salt = genSaltSync(SALT_ROUNDS);
  return hashSync(otp.toString(), salt);
};

export const validateOtp = (otp: number, hashedOtp: string) => {
  const result = compareSync(otp.toString(), hashedOtp);
  return result;
};
