export interface UserType {
  firstName: string;
  lastName: string;
  email: string;
  DOB: Date;
  password: string;
}

// without the password
export type SafeUserType = Omit<UserType, "password">
