import axiosInstance from "../../../utils/axiosConfig";
import type {
    Department,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
} from "../../../types/department.types";

const API_BASE = "/department";

export const departmentApi = {

    // GET /department
    async findAll(): Promise<Department[]> {
        const response = await axiosInstance.get(API_BASE);
        return response.data;
    },

    // GET /department/:id
    async findById(id: string): Promise<Department> {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    // POST /department
    async create(data: CreateDepartmentPayload): Promise<void> {
        await axiosInstance.post(API_BASE, data);
    },

    // PUT /department/:id
    async update(id: string, data: UpdateDepartmentPayload): Promise<void> {
        await axiosInstance.put(`${API_BASE}/${id}`, data);
    },

    // DELETE /department/:id
    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`${API_BASE}/${id}`);
    },
};
