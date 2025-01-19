// SHARED TYPE: Sync with frontend
export interface AdminType {
    id: string;
    username: string;
    password: string;
}

// SHARED TYPE: Sync with frontend
export type SafeAdminType = Omit<AdminType, "password">
