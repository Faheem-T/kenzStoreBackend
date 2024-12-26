import { hashSync, genSaltSync } from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): string => {
    const salt = genSaltSync(SALT_ROUNDS)
    return hashSync(password, salt)
}

// export const checkPasswordValidity;
