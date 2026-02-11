import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export function useVerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token");

    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        // Chỉ LƯU token vào sessionStorage
        // KHÔNG gọi API verify ở đây
        sessionStorage.setItem("pendingVerificationToken", token);

        // Redirect về login để lấy email
        navigate("/login", {
            replace: true,
            state: { message: "Please login to verify your email" }
        });
    }, [token, navigate]);
}