export type UserStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "NONE";

export type UserRole = "ADMIN" | "EMPLOYEE" | "MANAGER";

export interface UserAuth {
    id: string;
    email: string;
    gender: string;
    status: UserStatus;
    role: UserRole;
    createdAt?: string;
    updatedAt?: string;
}