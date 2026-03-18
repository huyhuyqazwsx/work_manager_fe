import type {
    OTType,
    OTPlanStatus,
    OTTicketStatus,
    CompensationTransactionType,
} from "./enum/enum.ts";

// ================= ENTITIES =================

export interface OTPlan {
    id: string;
    departmentId: string;
    managerId: string;
    reason: string;
    status: OTPlanStatus;

    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    ticketPayload: any | null; // Prisma.JsonValue

    rejectedBy: string | null;
    rejectionNote: string | null;
    approvedBy: string | null;

    tickets?: OTTicket[];

    createdAt: string;
    updatedAt: string;
    rejectedAt?: string;
    approvedAt?: string;
}

export interface OTTicket {
    id: string;
    planId: string;
    userId: string;

    otType: OTType | null;

    workDate: string;
    startTime: string;
    endTime: string;
    totalHours: number;

    status: OTTicketStatus;

    plan: string | null;
    result: string | null;
    actualHours: number | null;

    verifiedBy: string | null;
    rejectNote: string | null;

    checkIn?: string;
    checkOut?: string;

    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
}

export interface CompensationTransaction {
    id: string;
    userId: string;
    type: CompensationTransactionType;
    hours: number;
    note?: string;
    createdAt: string;
}

// ================= REQUESTS =================

export interface CreateOTPlanPayload {
    otType: OTType;
    plannedDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

export interface ApproveOTPlanPayload {
    status: OTPlanStatus.APPROVED | OTPlanStatus.REJECTED;
    note?: string;
}

// ================= NEW NESTJS DTOs =================

export interface CreateOTTicketItemDto {
    employeeCode: string;
    startDate: string;
    endDate: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
}

export interface CreateOTPlanDto {
    departmentId: string;
    managerId: string;
    reason: string;
    tickets: CreateOTTicketItemDto[];
}

export interface PreviewOTPlanDto {
    tickets: CreateOTTicketItemDto[];
}

export interface PreviewWarningItem {
    employeeCode: string;
    date: string;
    warnings: string[];
}

export interface PreviewOTPlanResponseDto {
    warnings: PreviewWarningItem[];
    hasWarnings: boolean;
}

export interface UpdateOTPlanDto {
    reason?: string;
    tickets?: CreateOTTicketItemDto[];
}

export interface CheckInOtTicketDto {
    workPlan: string;
    otType: OTType;
}
