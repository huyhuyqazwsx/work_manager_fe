import axiosInstance from "../../../utils/axiosConfig";
import type { CompensationBalance } from "../../../types/compensation.types";

const API_BASE = "/compensation";

export const compensationApi = {
    // GET /compensation/balance/:userId
    async getBalance(userId: string): Promise<CompensationBalance> {
        const response = await axiosInstance.get(`${API_BASE}/balance/${userId}`);
        return response.data;
    },
};
