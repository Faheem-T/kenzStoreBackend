import {hashSync, genSaltSync, compareSync} from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): string => {
    const salt = genSaltSync(SALT_ROUNDS)
    return hashSync(password, salt)
}

export const validatePassword = (password: string, hashedPassword: string): boolean => {
    return compareSync(password, hashedPassword)
}
