import { useEffect, useState } from "react";
import { getRoleFromCookie } from "../../../utils/auth.utils";
import { userApi } from "../../../features/user/api/userApi";
import type { UserResponse } from "../../../types/user.types";
import { useNavigate } from "react-router-dom";

import "./home.css";
import LeaveManagementPage from "../leave/LeavePage.tsx";
import OTManagementPage from "../ot/OTPage.tsx";

type TabType = "leave" | "ot";

export default function HomePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("leave");

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
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-title">SkyCorp HRM</div>
                </div>

                <nav className="nav-menu">
                    <div
                        className={`nav-item ${activeTab === "leave" ? "active" : ""}`}
                        onClick={() => setActiveTab("leave")}
                    >
                        Leave Management
                    </div>

                    <div
                        className={`nav-item ${activeTab === "ot" ? "active" : ""}`}
                        onClick={() => setActiveTab("ot")}
                    >
                        OT Management
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="user-info">
                            <div className="user-name">
                                {profile?.fullName}
                            </div>
                            <div className="user-role">
                                {profile?.role}
                            </div>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        →
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {activeTab === "leave" && <LeaveManagementPage userId={profile?.id ?? ""} />}
                {activeTab === "ot" && <OTManagementPage userId={profile?.id ?? ""} />}
            </main>
        </div>
    );
}