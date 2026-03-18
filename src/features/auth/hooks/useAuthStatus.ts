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
            console.log("[useAuthStatus] status =", status);
            switch (status) {
                case "ACTIVE":
                    sessionStorage.removeItem("pendingVerificationToken");

                    try {
                        // Try localStorage first (cross-domain production)
                        let token = localStorage.getItem("accessToken");
                        console.log("[useAuthStatus] localStorage accessToken =", token ? "found" : "(empty)");

                        // Fallback: try cookie (same-domain / local dev)
                        if (!token) {
                            const allCookies = document.cookie;
                            console.log("[useAuthStatus] document.cookie =", allCookies || "(empty)");
                            const tokenCookie = allCookies.split(';').find(c => c.trim().startsWith('accessToken='));
                            token = tokenCookie?.split('=')[1] ?? null;
                        }

                        const decoded = jwtDecode<{ role: UserRole }>(token!);
                        console.log("[useAuthStatus] decoded role =", decoded.role);
                        navigate(ROLE_ROUTES[decoded.role] ?? '/login', { replace: true });
                    } catch (err) {
                        console.error("[useAuthStatus] ACTIVE handler failed:", err);
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