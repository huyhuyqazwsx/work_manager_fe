import type { LeaveTypeCode } from "./enum/enum.ts";

// ================= ENTITIES =================

export interface LeaveType {
    id: string;
    code: LeaveTypeCode;
    name: string;
    isPaid: boolean;
    deductCompensation: boolean;
    createdAt: string;
}

// ================= REQUESTS =================

export interface CreateLeaveTypeDto {
    code: string;
    name: string;
    isPaid?: boolean;
    deductCompensation?: boolean;
}

export interface UpdateLeaveTypeDto {
    name?: string;
    isPaid?: boolean;
    deductCompensation?: boolean;
}
