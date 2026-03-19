import { useState } from "react";
import type { UserResponse } from "../../../types/user.types";

type TabType = "employee" | "leave" | "ot" | "report_leave" | "report_ot";

interface Props {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    profile: UserResponse | null;
    onLogout: () => void;
}

export default function HRSidebar({
    activeTab,
    setActiveTab,
    profile,
    onLogout,
}: Props) {
    const isReportActive = activeTab === "report_leave" || activeTab === "report_ot";
    const [reportOpen, setReportOpen] = useState(isReportActive);

    const handleReportClick = () => {
        const next = !reportOpen;
        setReportOpen(next);
        if (next && !isReportActive) setActiveTab("report_leave");
    };

    return (
        <aside className="hr-sidebar">
            <div className="hr-sidebar-header">
                <div className="hr-logo-title">SkyCorp HRM</div>
                <div className="hr-logo-subtitle">ENTERPRISE</div>
            </div>

            <nav className="hr-nav-menu">
                <div
                    className={`hr-nav-item ${activeTab === "employee" ? "active" : ""}`}
                    onClick={() => setActiveTab("employee")}
                >
                    Employee Management
                </div>

                <div
                    className={`hr-nav-item ${activeTab === "leave" ? "active" : ""}`}
                    onClick={() => setActiveTab("leave")}
                >
                    Leave Management
                </div>

                <div
                    className={`hr-nav-item ${activeTab === "ot" ? "active" : ""}`}
                    onClick={() => setActiveTab("ot")}
                >
                    OT Management
                </div>

                {/* Report expandable */}
                <div
                    className={`hr-nav-item ${isReportActive ? "active" : ""}`}
                    onClick={handleReportClick}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg className="hr-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        Report
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transition: "transform 0.2s", transform: reportOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
                {reportOpen && (
                    <>
                        <div
                            className={`hr-nav-subitem ${activeTab === "report_leave" ? "active" : ""}`}
                            onClick={() => setActiveTab("report_leave")}
                        >
                            Leave Management
                        </div>
                        <div
                            className={`hr-nav-subitem ${activeTab === "report_ot" ? "active" : ""}`}
                            onClick={() => setActiveTab("report_ot")}
                        >
                            OT Management
                        </div>
                    </>
                )}

            </nav>

            <div className="hr-sidebar-footer">
                <div className="hr-user-profile">
                    <div className="hr-user-avatar">
                        {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="hr-user-meta">
                        <div className="hr-user-name-row">
                            <span className="hr-user-name">
                                {profile?.fullName || "User"}
                            </span>

                            <button
                                className="hr-logout-btn"
                                onClick={onLogout}
                                title="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="hr-user-role">
                            {profile?.role || "Employee"}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}