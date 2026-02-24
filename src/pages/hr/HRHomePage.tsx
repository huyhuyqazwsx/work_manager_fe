import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./hrhome.css";

import HRSidebar from "./components/HRSidebar";
import OTManagementPage from "./OTManagementPage";
import EmployeeDirectory from "./EmployeeDirectory";
import LeaveManagementPage from "./LeaveManagementPage";
import ReportPage from "./ReportPage";

import type { UserAuth } from "../../types/user.types";
import { getRoleFromCookie } from "../../utils/auth.utils";
import { userApi } from "../../features/user/api/userApi";

type TabType = "employee" | "leave" | "ot" | "report";

export default function HRHomePage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>("employee");
    const [profile, setProfile] = useState<UserAuth | null>(null);
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

                // cache nếu muốn dùng global
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
            <div className="loading-screen">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="hr-layout">
            <HRSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                profile={profile}
                onLogout={handleLogout}
            />

            <main className="hr-main-content">
                {activeTab === "employee" && <EmployeeDirectory />}
                {activeTab === "leave" && <LeaveManagementPage />}
                {activeTab === "ot" && <OTManagementPage />}
                {activeTab === "report" && <ReportPage />}
            </main>
        </div>
    );
}