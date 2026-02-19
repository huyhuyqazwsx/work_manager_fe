export type UserStatus = "ACTIVE" | "PENDING" | "INACTIVE" | "NONE";

export enum UserRole {
    EMPLOYEE = 'EMPLOYEE',
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
    HR = 'HR',
    BOD = 'BOD',
}

export interface UserAuth {
    id: string,
    email: string,
    fullName: string,
    gender: string,
    status: UserStatus,
    role: UserRole,
    hireDate: Date,
    createdAt?: Date,
    updatedAt?: Date,
}