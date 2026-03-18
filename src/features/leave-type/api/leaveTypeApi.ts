import axiosInstance from "../../../utils/axiosConfig";
import type {
    LeaveType,
    CreateLeaveTypeDto,
    UpdateLeaveTypeDto,
} from "../../../types/leave-type.types";

const API_BASE = "/leave-type";

export const leaveTypeApi = {
    // GET /leave-type
    async findAll(): Promise<LeaveType[]> {
        const cached = localStorage.getItem("leave_types");
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {}
        }
        const response = await axiosInstance.get(API_BASE);
        localStorage.setItem("leave_types", JSON.stringify(response.data));
        return response.data;
    },

    // GET /leave-type/active
    async findAllActive(): Promise<LeaveType[]> {
        const response = await axiosInstance.get(`${API_BASE}/active`);
        return response.data;
    },

    // GET /leave-type/:id
    async findById(id: string): Promise<LeaveType | null> {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    // POST /leave-type
    async create(dto: CreateLeaveTypeDto): Promise<LeaveType> {
        const response = await axiosInstance.post(API_BASE, dto);
        return response.data;
    },

    // PATCH /leave-type/:id
    async update(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
        const response = await axiosInstance.patch(`${API_BASE}/${id}`, dto);
        return response.data;
    },
};
