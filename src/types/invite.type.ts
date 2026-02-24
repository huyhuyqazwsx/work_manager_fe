export interface InviteForm {
    email: string;
    role: string;
    hireDate: string;
    departmentCode?: string;
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
    inviteResult?: {
        PENDING: string[];
        ACTIVE: string[];
        INACTIVE: string[];
    };
}