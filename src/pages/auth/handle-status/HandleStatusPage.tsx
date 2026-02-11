import { useSearchParams } from "react-router-dom";
import type { UserStatus } from "../../../types/user.types";
import { useAuthStatus } from "../../../features/auth/hooks/useAuthStatus";
import "./handle-status.css";

export default function HandleStatusPage() {
    const [params] = useSearchParams();

    const status = params.get("user_status") as UserStatus | null;
    const email = params.get("email");

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
