import axios from "axios";
const BE_URL = import.meta.env.VITE_BE_URL;

const axiosInstance = axios.create({
    baseURL: `${BE_URL}`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach token from cookie as Authorization header (works cross-domain)
axiosInstance.interceptors.request.use((config) => {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('accessToken='));
    const token = match ? match.trim().slice('accessToken='.length) : null;
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = error.config?.url;

        // Không redirect nếu đang verify email (để hiển thị lỗi cho user)
        const isVerifyRequest = url?.includes('/verify-email');
        const isResendRequest = url?.includes('/resend-invite');
        const isLoginRequest = url?.includes('/login-user');
        const isRefreshRequest = url?.includes('/auth/refresh');

        if (status === 401 && !originalRequest._retry && !isLoginRequest && !isVerifyRequest && !isResendRequest && !isRefreshRequest) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const rtMatch = document.cookie.split(';').find(c => c.trim().startsWith('refreshToken='));
                const refreshToken = rtMatch ? rtMatch.trim().slice('refreshToken='.length) : null;
                const refreshRes = await axiosInstance.post('/auth/refresh', refreshToken ? { refreshToken } : undefined);
                const newToken = refreshRes.data?.accessToken;
                if (newToken) {
                    document.cookie = `accessToken=${newToken}; path=/; max-age=86400; SameSite=Lax`;
                }

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (err) {
                processQueue(err, null);
                document.cookie = 'accessToken=; path=/; max-age=0';
                document.cookie = 'refreshToken=; path=/; max-age=0';
                localStorage.removeItem("profile");
                window.location.href = '/login';
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
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