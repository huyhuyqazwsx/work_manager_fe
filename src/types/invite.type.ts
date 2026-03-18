import {type ContractType, UserRole} from "./enum/enum.ts";

export interface InviteForm {
    employeeCode?: string;

    email: string;

    department: string;

    position?: string;

    contractType: ContractType;

    joinDate: string;

    contractSignedDate?: string;

    role: UserRole;
}

export interface InviteUsersResult {
    PENDING: string[];
    ACTIVE: string[];
    INACTIVE: string[];
}

export interface InviteImportError {
    row: number;
    field?: string;
    email?: string;
    value?: any;
    reason: string;
}

export interface InviteImportResponse {
    total: number;
    success: number;
    failed: number;
    validData: InviteForm[];
    errors: InviteImportError[];
    inviteResult?: InviteUsersResult;
}