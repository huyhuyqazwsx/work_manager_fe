import axiosInstance from "../../../utils/axiosConfig";
import type {
    CreateLeaveConfigDto,
    CreateOTConfigDto,
    CreatePaidPersonalEventDto,
    LeaveConfig,
    OTConfig,
    PaidPersonalLeaveEvent,
    UpdateLeaveConfigDto,
    UpdateOTConfigDto,
    UpdatePaidPersonalEventDto
} from "../../../types/policy.types";
import { ContractType, PaidPersonalEventCode } from "../../../types/enum/enum";

export const policyApi = {
    // ----- LeaveConfig -----
    async getAllLeaveConfigs(): Promise<LeaveConfig[]> {
        const res = await axiosInstance.get("/policy/leave-config");
        return res.data;
    },

    async getLeaveConfigById(id: string): Promise<LeaveConfig> {
        const res = await axiosInstance.get(`/policy/leave-config/${id}`);
        return res.data;
    },

    async getLeaveConfigByContractType(contractType: ContractType): Promise<LeaveConfig> {
        const res = await axiosInstance.get(`/policy/leave-config/contract/${contractType}`);
        return res.data;
    },

    async createLeaveConfig(dto: CreateLeaveConfigDto): Promise<void> {
        await axiosInstance.post("/policy/leave-config", dto);
    },

    async updateLeaveConfig(id: string, dto: UpdateLeaveConfigDto): Promise<void> {
        await axiosInstance.put(`/policy/leave-config/${id}`, dto);
    },

    async deleteLeaveConfig(id: string): Promise<void> {
        await axiosInstance.delete(`/policy/leave-config/${id}`);
    },

    // ----- OTConfig -----
    async getActiveOTConfig(): Promise<OTConfig> {
        const res = await axiosInstance.get("/policy/ot-config/active");
        return res.data;
    },

    async getAllOTConfigs(): Promise<OTConfig[]> {
        const res = await axiosInstance.get("/policy/ot-config");
        return res.data;
    },

    async getOTConfigById(id: string): Promise<OTConfig> {
        const res = await axiosInstance.get(`/policy/ot-config/${id}`);
        return res.data;
    },

    async createOTConfig(dto: CreateOTConfigDto): Promise<void> {
        await axiosInstance.post("/policy/ot-config", dto);
    },

    async updateOTConfig(id: string, dto: UpdateOTConfigDto): Promise<void> {
        await axiosInstance.put(`/policy/ot-config/${id}`, dto);
    },

    async deleteOTConfig(id: string): Promise<void> {
        await axiosInstance.delete(`/policy/ot-config/${id}`);
    },

    // ----- PaidPersonalLeaveEvent -----
    async getAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
        const res = await axiosInstance.get("/policy/paid-personal-event");
        return res.data;
    },

    async getPaidPersonalEventByCode(code: PaidPersonalEventCode): Promise<PaidPersonalLeaveEvent> {
        const res = await axiosInstance.get(`/policy/paid-personal-event/${code}`);
        return res.data;
    },

    async createPaidPersonalEvent(dto: CreatePaidPersonalEventDto): Promise<void> {
        await axiosInstance.post("/policy/paid-personal-event", dto);
    },

    async updatePaidPersonalEvent(id: string, dto: UpdatePaidPersonalEventDto): Promise<void> {
        await axiosInstance.put(`/policy/paid-personal-event/${id}`, dto);
    },

    async deletePaidPersonalEvent(id: string): Promise<void> {
        await axiosInstance.delete(`/policy/paid-personal-event/${id}`);
    },
};
