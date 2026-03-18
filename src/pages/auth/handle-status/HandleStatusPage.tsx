import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserStatus } from "../../../types/user.types";
import { useAuthStatus } from "../../../features/auth/hooks/useAuthStatus";
import "./handle-status.css";

export default function HandleStatusPage() {
    const [params] = useSearchParams();

    const status = params.get("user_status") as UserStatus | null;
    const email = params.get("email");
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    // Store tokens from URL into cookies (JS-accessible, FE domain)
    useEffect(() => {
        console.log("[HandleStatusPage] accessToken from URL:", accessToken ?? "(null)");
        console.log("[HandleStatusPage] refreshToken from URL:", refreshToken ?? "(null)");
        if (accessToken) {
            document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
            console.log("[HandleStatusPage] accessToken saved to cookie ✓");
        }
        if (refreshToken) {
            document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
            console.log("[HandleStatusPage] refreshToken saved to cookie ✓");
        }
        console.log("[HandleStatusPage] document.cookie after save:", document.cookie);
    }, [accessToken, refreshToken]);

    useAuthStatus(status, email ?? undefined);

    return (
        <div className="status-root">
            <div className="status-card">
                <div className="spinner" />

                <h2>Checking Account Status</h2>

                <p className="hint">
                    Please wait while we prepare your workspace
                    {email ? <> for <strong>{email}</strong></> : null}.
                </p>

                <div className="status-chip">
                    {status ?? "UNKNOWN"}
                </div>
            </div>
        </div>
    );
}
