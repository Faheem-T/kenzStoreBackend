// SHARED TYPE: Sync with frontend
export interface UserType {
  firstName: string;
  lastName: string;
  email: string;
  DOB: Date;
  password: string;
  // user verification fields
  expiresAt: Date;
  isVerified: boolean;
  // timestamp fields
  createdAt: Date;
  updatedAt: Date;
}

// SHARED TYPE: Sync with frontend
// without the password
export type SafeUserType = Omit<UserType, "password">;
