import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import "../department-head/deptheadhome.css"; // Reuse DH layout styles
import BODSidebar from "./components/BODSidebar";
import LeaveApprovalPage from "../department-head/leave/LeaveApprovalPage";
import BODOTManagementPage from "./ot/BODOTManagementPage";
import BODOTRulesPage from "./settings/BODOTRulesPage";
import BODLeavePolicyPage from "./settings/BODLeavePolicyPage";
import BODHolidayPage from "./settings/BODHolidayPage";

import type { UserResponse } from "../../types/user.types";
import { getRoleFromCookie } from "../../utils/auth.utils";
import { userApi } from "../../features/user/api/userApi";

export default function BODHomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = getRoleFromCookie();
        if (!role) {
            navigate("/login", { replace: true });
            return;
        }

        userApi
            .getProfile()
            .then((data) => {
                setProfile(data);
                localStorage.setItem("profile", JSON.stringify(data));
            })
            .catch(() => navigate("/login", { replace: true }))
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleLogout = () => {
        document.cookie = "accessToken=; Max-Age=0; path=/";
        document.cookie = "refreshToken=; Max-Age=0; path=/";
        sessionStorage.clear();
        localStorage.removeItem("profile");
        navigate("/login", { replace: true });
    };

    if (loading) {
        return (
            <div className="dh-loading-screen">
                <div className="dh-loading-spinner" />
            </div>
        );
    }

    return (
        <div className="dh-layout">
            <BODSidebar
                pathname={location.pathname}
                profile={profile}
                onLogout={handleLogout}
            />

            <main className="dh-main-content">
                <Routes>
                    <Route path="/" element={<Navigate to="leave" replace />} />

                    <Route path="leave" element={<LeaveApprovalPage isBOD={true} />} />
                    <Route path="ot" element={<BODOTManagementPage userId={profile?.id ?? ""} />} />

                    <Route path="settings" element={<Navigate to="ot-rules" replace />} />
                    <Route path="settings/ot-rules" element={<BODOTRulesPage />} />
                    <Route path="settings/leave-policy" element={<BODLeavePolicyPage />} />
                    <Route path="settings/holiday" element={<BODHolidayPage />} />

                    <Route path="*" element={<Navigate to="leave" replace />} />
                </Routes>
            </main>
        </div>
    );
}
