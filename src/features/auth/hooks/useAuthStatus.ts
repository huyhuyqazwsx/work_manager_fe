import { parseBackendError } from "../../../utils/error.utils";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {UserRole, UserStatus} from "../../../types/user.types.ts";
import {userApi} from "../../user/api/userApi.ts";
import {jwtDecode} from "jwt-decode";

const ROLE_ROUTES: Record<UserRole, string> = {
    EMPLOYEE: '/employee',
    DEPARTMENT_HEAD: '/department-head',
    HR: '/hr',
    BOD: '/bod',
};

const BE_URL = import.meta.env.VITE_BE_URL;

export function useAuthStatus(
    status: UserStatus | null,
    email?: string | null
) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!status) {
            navigate("/login", { replace: true });
            return;
        }

        const pendingToken = sessionStorage.getItem("pendingVerificationToken");

        const handleStatus = async () => {
            switch (status) {
                case "ACTIVE":
                    sessionStorage.removeItem("pendingVerificationToken");

                    try {
                        // Try cookie-based decode first (works in local dev)
                        const cookies = document.cookie.split(';');
                        const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
                        const token = tokenCookie?.split('=')[1];
                        if (token) {
                            const decoded = jwtDecode<{ role: UserRole }>(token);
                            navigate(ROLE_ROUTES[decoded.role] ?? '/login', { replace: true });
                            break;
                        }
                        // Fallback: cookie is HttpOnly or cross-domain → call API
                        const profile = await userApi.getProfile();
                        localStorage.setItem("profile", JSON.stringify(profile));
                        navigate(ROLE_ROUTES[profile.role] ?? '/login', { replace: true });
                    } catch {
                        navigate('/login', { replace: true });
                    }
                    break;

                case "PENDING":
                    if (pendingToken && email) {
                        console.log("🔄 Auto-verifying email...");

                        try {
                            await userApi.verifyEmail({ email, token: pendingToken });

                            sessionStorage.removeItem("pendingVerificationToken");

                            window.location.href = `${BE_URL}/auth/zoho`;

                        } catch (error: any) {
                            console.error("❌ Verification failed:", error);

                            sessionStorage.removeItem("pendingVerificationToken");

                            // Phân loại lỗi chi tiết
                            let errorType = 'unknown';
                            let errorMessage = "Verification failed. Please try again.";

                            const responseMessage = parseBackendError(error, '');

                            if (responseMessage.includes('expired')) {
                                errorType = 'expired';
                                errorMessage = "⏰ Verification link has expired (24 hours limit). Please request a new one.";
                            } else if (responseMessage.includes('Invalid') || responseMessage.includes('invalid')) {
                                errorType = 'invalid';
                                errorMessage = "🔗 Invalid verification link. Please check your email or request a new one.";
                            } else if (responseMessage.includes('not found')) {
                                errorType = 'notfound';
                                errorMessage = "❓ User not found. Please contact support.";
                            } else if (error.response?.status === 403) {
                                errorType = 'forbidden';
                                errorMessage = "🚫 Account is inactive. Please contact your administrator.";
                            } else {
                                errorMessage = responseMessage || error.message || "Verification failed.";
                            }

                            navigate("/inactive", {
                                replace: true,
                                state: {
                                    email,
                                    reason: "PENDING",
                                    error: errorMessage,
                                    errorType: errorType,
                                },
                            });
                        }
                    } else {
                        navigate("/inactive", {
                            replace: true,
                            state: {
                                email,
                                reason: "PENDING",
                            },
                        });
                    }
                    break;

                case "INACTIVE":
                    sessionStorage.removeItem("pendingVerificationToken");
                    navigate("/inactive", {
                        replace: true,
                        state: {
                            email,
                            reason: "INACTIVE",
                        },
                    });
                    break;

                case "NONE":
                    sessionStorage.removeItem("pendingVerificationToken");
                    navigate("/email-not-found", {
                        replace: true,
                        state: { email },
                    });
                    break;

                default:
                    navigate("/login", { replace: true });
            }
        };

        handleStatus();
    }, [status, email, navigate]);
}