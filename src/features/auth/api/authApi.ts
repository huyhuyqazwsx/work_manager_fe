import axiosInstance from "../../../utils/axiosConfig.ts";

const BE_URL = import.meta.env.VITE_BE_URL;
const API_BASE = "auth";

export const authApi = {
    loginWithZoho() {
        window.location.href = `${BE_URL}/${API_BASE}/zoho`;
    },

    async verifyEmail(email: string, token: string): Promise<void> {
        const response = await axiosInstance.post('/user/verify-email', {
            email,
            token
        });
        return response.data;
    },

    async refresh(): Promise<void> {
        const response = await axiosInstance.post(`/${API_BASE}/refresh`);
        return response.data;
    },
};