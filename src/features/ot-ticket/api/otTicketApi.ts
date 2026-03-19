import axiosInstance from "../../../utils/axiosConfig";
import type { OTTicket, CheckInOtTicketDto } from "../../../types/ot.types";

const API_BASE = "/ot-ticket";

export const otTicketApi = {
    // GET /ot-ticket/:id
    async getTicketById(id: string): Promise<OTTicket> {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    // GET /ot-ticket/plan/:planId
    async getTicketsByPlan(planId: string): Promise<OTTicket[]> {
        const response = await axiosInstance.get(`${API_BASE}/plan/${planId}`);
        return response.data;
    },

    // GET /ot-ticket/my-tickets
    async getMyTickets(): Promise<OTTicket[]> {
        const response = await axiosInstance.get(`${API_BASE}/my-tickets`);
        return response.data;
    },

    // PATCH /ot-ticket/:id/check-in
    async checkIn(id: string, dto: CheckInOtTicketDto): Promise<OTTicket> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/check-in`, dto);
        return response.data;
    },

    // PATCH /ot-ticket/:id/check-out
    async checkOut(id: string, result: string): Promise<OTTicket> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/check-out`, { result });
        return response.data;
    },

    // PATCH /ot-ticket/:id/verify
    async verify(id: string): Promise<OTTicket> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/verify`);
        return response.data;
    },

    // PATCH /ot-ticket/:id/reject
    async reject(id: string, note: string): Promise<OTTicket> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/reject`, { note });
        return response.data;
    },

    // PATCH /ot-ticket/:id/cancel
    async cancel(id: string): Promise<OTTicket> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}/cancel`);
        return response.data;
    },

    // GET /ot-ticket/my-hours/day  → returns plain number
    async getMyHoursByDay(): Promise<number> {
        const date = new Date().toISOString().slice(0, 10);
        const response = await axiosInstance.get(`${API_BASE}/my-hours/day`, { params: { date } });
        return Number(response.data) || 0;
    },

    // GET /ot-ticket/my-hours/month  → returns plain number
    async getMyHoursByMonth(): Promise<number> {
        const date = new Date().toISOString().slice(0, 10);
        const response = await axiosInstance.get(`${API_BASE}/my-hours/month`, { params: { date } });
        return Number(response.data) || 0;
    },

    // GET /ot-ticket/my-hours/year  → returns plain number
    async getMyHoursByYear(): Promise<number> {
        const date = new Date().toISOString().slice(0, 10);
        const response = await axiosInstance.get(`${API_BASE}/my-hours/year`, { params: { date } });
        return Number(response.data) || 0;
    },
};
