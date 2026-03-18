import type {
    LeaveRequestStatus,
    HolidaySession,
    LeaveTypeCode,
    PaidPersonalEventCode,
} from "./enum/enum.ts";

// ================= ENTITIES =================

export interface LeaveRequest {
    id: string;
    leaveTypeCode: string | null;
    status: LeaveRequestStatus;

    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
    totalDays: number;
    paidDays: number;
    unpaidDays: number;

    reason: string | null;
    createdBy: string;
    approvedBy: string | null;
    approvedAt: string | null;

    paidPersonalEventCode: string | null;
    attachmentUrl: string | null;
    emailSend: string | null;
    emailCC: string[];

    createdAt: string;
}

export interface LeaveBalance {
    userId: string;
    leaveTypeCode: LeaveTypeCode;
    balance: number;
    used: number;
    remaining: number;
    year: number;
}

// ================= REQUESTS =================

export interface EmailInfo {
    email: string;
    name: string;
    role: string;
}

export interface NotifyEmailResponse {
    info: EmailInfo[];
}

export interface CreateLeaveRequestDto {
    userId: string;
    leaveTypeCode: LeaveTypeCode | string;
    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
    reason?: string;
    paidPersonalEventCode?: string;
    emailLeader?: string;
}

export interface RejectLeaveRequestDto {
    approverId: string;
    reason?: string | null;
}

export interface PreviewLeaveRequestDto {
    userCode: string;
    leaveTypeCode: string;
    paidPersonalEventCode?: PaidPersonalEventCode;
    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
    emailLeader?: string;
}

export interface PreviewLeaveResponseDto {
    actualLeaveDays: number;
    paidDays: number;
    unpaidDays: number;
    weekendDays: number;
    holidayDays: number;
    warnings: string[];
}

// ================= RESPONSES =================

export interface PaginatedLeaveRequests {
    data: LeaveRequest[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LeaveEligibilityResponseDto {
    leaveTypeCode: LeaveTypeCode;
    leaveTypeName: string;
    totalAllowedDays: number;
    usedDays: number;
    remainingDays: number;
    isEligible: boolean;
    reason: string | null;
}

export interface AnnualLeaveDashboardDto {
    totalAllowedDays: number;               // quota năm
    usedPaidDays: number;       // đã dùng có lương
    usedUnpaidDays: number;     // đã dùng không lương
    remainingPaidDays: number;           // còn lại có lương
    pendingDays: number;        // đang chờ duyệt
    compensationHours: number;
}
export interface RangeExistItemDto {
    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
}

export interface RangeExistDto {
    range: RangeExistItemDto[];
}
