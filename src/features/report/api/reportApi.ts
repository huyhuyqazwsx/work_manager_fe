import axiosInstance from "../../../utils/axiosConfig";
import type { LeaveRequestStatus } from "../../../types/enum/enum";
import type { OTPlan } from "../../../types/ot.types";

export interface GetOTPlanReportDto {
    search?: string;
    departmentId?: string;
    status?: string;
    month?: string; // YYYY-MM
    page?: number;
    limit?: number;
}

export interface OTPlanReportResponse {
    data: OTPlan[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const API_BASE = "/reports";

export interface GetLeaveReportDto {
    search?: string;
    departmentId?: string;
    leaveTypeCode?: string;
    status?: LeaveRequestStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
}

export interface LeaveReportItem {
    id: string;
    leaveTypeCode: string | null;
    status: LeaveRequestStatus;
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string | null;
    createdBy: string;
    departmentId: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
}

export interface LeaveReportResponse {
    data: LeaveReportItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const reportApi = {
    // GET /reports/leave
    async getLeaveReport(dto: GetLeaveReportDto = {}): Promise<LeaveReportResponse> {
        const response = await axiosInstance.get(`${API_BASE}/leave`, { params: dto });
        return response.data;
    },

    // GET /reports/leave-monthly/export-all?month=&year=  → file download
    async exportLeaveMonthly(month: number, year: number): Promise<void> {
        const response = await axiosInstance.get(`${API_BASE}/leave-monthly/export-all`, {
            params: { month, year },
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `leave-report-${year}-${String(month).padStart(2, "0")}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    // GET /reports/ot-plans
    async getAllOTPlanForHR(dto: GetOTPlanReportDto = {}): Promise<OTPlanReportResponse> {
        const response = await axiosInstance.get(`${API_BASE}/ot-plans`, { params: dto });
        return response.data;
    },

    // GET /reports/leave-yearly/export-all?year=  → file download
    async exportLeaveYearly(year: number): Promise<void> {
        const response = await axiosInstance.get(`${API_BASE}/leave-yearly/export-all`, {
            params: { year },
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `leave-report-${year}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    },
};
