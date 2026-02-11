import axiosInstance from "../../../utils/axiosConfig.ts";
const API_BASE = "auth";

export const authApi = {
    loginWithZoho() {
        window.location.href = `https://localhost:3000/v1/${API_BASE}/zoho`;
    },

    async verifyEmail(email: string, token: string): Promise<void> {
        const response = await axiosInstance.post('/user/verify-email', {
            email,
            token
        });
        return response.data;
    },
};