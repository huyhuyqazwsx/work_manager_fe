import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "https://localhost:3000/v1/",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

        // Không redirect nếu đang verify email (để hiển thị lỗi cho user)
        const isVerifyRequest = url?.includes('/verify-email');
        const isResendRequest = url?.includes('/resend-invite');
        const isLoginRequest = url?.includes('/login-user');

        if (status === 401 && !isLoginRequest && !isVerifyRequest && !isResendRequest) {
            localStorage.clear();
            window.location.href = '/login';
        }

        if (status === 403 && !isVerifyRequest) {
            // Nếu là verify thì throw error để useAuthStatus xử lý
            if (!isVerifyRequest) {
                window.location.href = '/403';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;