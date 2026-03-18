import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./deptheadhome.css";

import DeptHeadSidebar from "./components/DeptHeadSidebar";
import LeaveApprovalPage from "./leave/LeaveApprovalPage";
import OTManagementPage from "../employee/ot/OTPage";

import type { UserResponse } from "../../types/user.types";
import { getRoleFromCookie } from "../../utils/auth.utils";
import { userApi } from "../../features/user/api/userApi";

type DHTabType = "leave" | "ot";

export default function DeptHeadHomePage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<DHTabType>("leave");
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
            <DeptHeadSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                profile={profile}
                onLogout={handleLogout}
            />

            <main className="dh-main-content">
                {activeTab === "leave" && <LeaveApprovalPage />}
                {activeTab === "ot" && <OTManagementPage userId={profile?.id ?? ""} />}
            </main>
        </div>
    );
}
