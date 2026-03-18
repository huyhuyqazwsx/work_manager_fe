import { ContractType, Gender, UserRole, type UserStatus } from "./enum/enum.ts";
export type { UserStatus };

// ================= ENTITIES =================

export interface UserAuth {
    id: string;
    code: string | null;
    email: string;
    fullName: string;
    gender: Gender;
    status: UserStatus;
    role: UserRole;

    departmentId: string;
    departmentName: string | null;
    position: string;
    contractType: ContractType;

    joinDate: string;
    contractSignedDate: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface UserResponse {
    id: string;
    code: string | null;

    email: string;
    fullName: string;

    status: UserStatus;
    role: UserRole;

    departmentCode: string;
    departmentName?: string;
    contractType: ContractType;

    joinDate: string;
    contractSignedDate: string | null;
}

// ================= REQUESTS =================

export interface InviteUsersRequest {
    emails: string[];
}

export interface ResendInviteRequest {
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    token: string;
}

export interface UpdateUserPayload {
    fullName?: string;
    email?: string;
    departmentId?: string;
    status?: UserStatus;
    contractType?: ContractType;
    joinDate?: string;
    contractSignedDate?: string | null;
}

export interface InviteUsersResult {
    PENDING: string[];
    ACTIVE: string[];
    INACTIVE: string[];
}

export interface UserInDepartmentDto {
    id: string;
    code: string | null;
    fullName: string;
}

export { UserRole };
