import axiosInstance from "../../../utils/axiosConfig";
import type {
    LeaveRequest,
    CreateLeaveRequestDto,
    RejectLeaveRequestDto,
    LeaveEligibilityResponseDto,
    PaginatedLeaveRequests,
    PreviewLeaveRequestDto,
    PreviewLeaveResponseDto,
    AnnualLeaveDashboardDto,
    NotifyEmailResponse,
    RangeExistDto,
} from "../../../types/leave.types";

const API_BASE = "/leave";

export const leaveApi = {
    // GET /leave
    async findAll(): Promise<LeaveRequest[]> {
        const response = await axiosInstance.get(API_BASE);
        return response.data;
    },

    // GET /leave/bod/:bodId
    async getByBod(bodId: string): Promise<LeaveRequest[]> {
        const response = await axiosInstance.get(`${API_BASE}/bod/${bodId}`);
        return response.data;
    },

    // GET /leave/manager/:managerId?page=&limit=
    async getByManager(managerId: string, page: number, limit: number): Promise<PaginatedLeaveRequests> {
        const response = await axiosInstance.get(`${API_BASE}/manager/${managerId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    // GET /leave/eligibility/:userId
    async getLeaveEligibility(userId: string): Promise<LeaveEligibilityResponseDto[]> {
        const response = await axiosInstance.get(`${API_BASE}/eligibility/${userId}`);
        return response.data;
    },

    // GET /leave/dashboard/annual/:userId
    async getAnnualLeaveDashboard(userId: string): Promise<AnnualLeaveDashboardDto> {
        const response = await axiosInstance.get(`${API_BASE}/dashboard/annual/${userId}`);
        return response.data;
    },

    // GET /leave/me/:userId?page=&limit=
    async getMyLeaveRequests(userId: string, page: number, limit: number): Promise<PaginatedLeaveRequests> {
        const response = await axiosInstance.get(`${API_BASE}/me/${userId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    // GET /leave/user/:userId
    async findByUserId(userId: string): Promise<LeaveRequest[]> {
        const response = await axiosInstance.get(`${API_BASE}/user/${userId}`);
        return response.data;
    },

    // POST /leave
    async create(data: CreateLeaveRequestDto, file?: File): Promise<LeaveRequest> {
        const formData = new FormData();
        formData.append("userId", data.userId);
        formData.append("leaveTypeCode", data.leaveTypeCode);
        formData.append("fromDate", data.fromDate);
        formData.append("toDate", data.toDate);
        formData.append("fromSession", data.fromSession);
        formData.append("toSession", data.toSession);

        if (data.reason) formData.append("reason", data.reason);
        if (data.paidPersonalEventCode) formData.append("paidPersonalEventCode", data.paidPersonalEventCode);
        if (data.emailLeader) formData.append("emailLeader", data.emailLeader);
        if (file) formData.append("file", file);

        const response = await axiosInstance.post(API_BASE, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    // GET /leave/notify/:userId
    async getNotifyInfo(userId: string): Promise<NotifyEmailResponse> {
        const response = await axiosInstance.get(`${API_BASE}/notify/${userId}`);
        return response.data;
    },

    // PATCH /leave/:id/approve
    async approve(id: string, approverId: string): Promise<LeaveRequest> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/approve`, { approverId });
        return response.data;
    },

    // PATCH /leave/:id/reject
    async reject(id: string, data: RejectLeaveRequestDto): Promise<LeaveRequest> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/reject`, data);
        return response.data;
    },

    // PATCH /leave/:id/cancel
    async cancel(id: string, userId: string): Promise<LeaveRequest> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/cancel`, { userId });
        return response.data;
    },

    // POST /leave/preview
    async previewLeaveRequest(dto: PreviewLeaveRequestDto): Promise<PreviewLeaveResponseDto> {
        const response = await axiosInstance.post(`${API_BASE}/preview`, dto);
        return response.data;
    },

    // GET /leave/range/:userId?year=
    async getRangeExistLeaveRequest(userId: string, year: number): Promise<RangeExistDto> {
        const response = await axiosInstance.get(`${API_BASE}/range/${userId}`, {
            params: { year },
        });
        return response.data;
    },
}
