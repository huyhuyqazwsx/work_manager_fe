// ================= ENTITIES =================

export interface Department {
    id: string;
    name: string;
    code: string;
    managerId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ================= REQUESTS =================

export interface CreateDepartmentPayload {
    name: string;
    code: string;
    managerId?: string | null;
    isActive?: boolean;
}

export interface UpdateDepartmentPayload {
    name?: string;
    code?: string;
    managerId?: string | null;
    isActive?: boolean;
}
