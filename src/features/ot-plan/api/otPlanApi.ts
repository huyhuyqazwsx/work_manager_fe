import axiosInstance from "../../../utils/axiosConfig";
import type {
    OTPlan,
    CreateOTPlanDto,
    UpdateOTPlanDto,
    PreviewOTPlanResponseDto
} from "../../../types/ot.types";

const API_BASE = "/ot-plan";

export const otPlanApi = {
    // GET /ot-plan/:id
    async getPlanById(id: string): Promise<OTPlan> {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    // GET /ot-plan/manager/:managerId?page=&limit=&status=&fromDate=&toDate=&search=
    async getMyPlans(managerId: string, page = 1, limit = 10, status?: string, fromDate?: string, toDate?: string, search?: string): Promise<{
        data: OTPlan[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const response = await axiosInstance.get(`${API_BASE}/manager/${managerId}`, {
            params: {
                page, limit,
                ...(status ? { status } : {}),
                ...(fromDate ? { fromDate } : {}),
                ...(toDate ? { toDate } : {}),
                ...(search ? { search } : {}),
            },
        });
        return response.data;
    },

    // GET /ot-plan/pending/all
    async getPendingPlans(): Promise<OTPlan[]> {
        const response = await axiosInstance.get(`${API_BASE}/pending/all`);
        return response.data;
    },

    // POST /ot-plan
    async createPlan(dto: CreateOTPlanDto): Promise<OTPlan> {
        const response = await axiosInstance.post(API_BASE, dto);
        return response.data;
    },

    // POST /ot-plan/preview
    async previewPlan(dto: CreateOTPlanDto): Promise<PreviewOTPlanResponseDto> {
        const response = await axiosInstance.post(`${API_BASE}/preview`, dto);
        return response.data;
    },

    // PUT /ot-plan/:id
    async updatePlan(id: string, dto: UpdateOTPlanDto): Promise<OTPlan> {
        const response = await axiosInstance.put(`${API_BASE}/${id}`, dto);
        return response.data;
    },

    // PATCH /ot-plan/:id/submit
    async submitPlan(id: string, managerId: string): Promise<OTPlan> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/submit`, { managerId });
        return response.data;
    },

    // PATCH /ot-plan/:id/approve
    async approvePlan(id: string, approvedBy: string): Promise<OTPlan> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/approve`, { approvedBy });
        return response.data;
    },

    // PATCH /ot-plan/:id/reject
    async rejectPlan(id: string, rejectedBy: string, note: string): Promise<OTPlan> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/reject`, { rejectedBy, note });
        return response.data;
    },

    // PATCH /ot-plan/:id/revise
    async revisePlan(id: string, managerId: string): Promise<OTPlan> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/revise`, { managerId });
        return response.data;
    },

    // PATCH /ot-plan/:id/cancel
    async cancelPlan(id: string, managerId: string): Promise<OTPlan> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/cancel`, { managerId });
        return response.data;
    },

    // DELETE /ot-plan/:id
    async deletePlan(id: string, managerId: string): Promise<void> {
        const response = await axiosInstance.delete(`${API_BASE}/${id}`, {
            data: { managerId }
        });
        return response.data;
    }
};
