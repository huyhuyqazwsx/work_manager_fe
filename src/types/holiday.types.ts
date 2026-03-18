import type { HolidayType, HolidaySession } from "./enum/enum.ts";

// ================= ENTITIES =================

export interface Holiday {
    id: string;
    name: string;
    date: string; // ISO string YYYY-MM-DD
    type: HolidayType;
    session: HolidaySession;
    isRecurring: boolean;
    isCompensatory: boolean;
    originalHolidayId?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ================= REQUESTS =================

export interface CreateHolidayPayload {
    name: string;
    date: string; // YYYY-MM-DD
    type: HolidayType;
    session: HolidaySession;
    isRecurring?: boolean;
}

export interface UpdateHolidayPayload {
    name?: string;
    date?: string;
    type?: HolidayType;
    session?: HolidaySession;
    isRecurring?: boolean;
}

// ================= RESPONSES =================

export interface CreateHolidayResponse {
    message: string;
    holiday: {
        id: string;
        name: string;
        date: string;
        needsCompensation: boolean;
    };
    compensatory?: {
        id: string;
        name: string;
        date: string;
    };
}

export interface HolidayTotalDays {
    year: number;
    regularHolidays: number;
    compensatoryHolidays: number;
    total: number;
}

export interface WeekendCountResult {
    startDate: string;
    endDate: string;
    weekendDays: number;
}

export interface LeaveDaysCalculation {
    fromDate: string;
    toDate: string;
    totalCalendarDays: number;
    weekendDays: number;
    holidayDays: number;
    compensatoryDays: number;
    actualLeaveDays: number;
}

export interface HolidayDateCheck {
    date: string;
    isHoliday: boolean;
    holiday?: Holiday;
}

export interface GenerateRecurringResult {
    year: number;
    generated: number;
    compensated: number;
    message: string;
}

// ================= QUERY PARAMS =================

export interface HolidayFilterParams {
    year?: number;
    month?: number;
    type?: HolidayType;
}

export interface CalculateLeaveDaysParams {
    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
}
