import type { UserResponse } from "../../../types/user.types";

type TabType = "employee" | "leave" | "ot" | "report";

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

                <div
                    className={`hr-nav-item ${activeTab === "report" ? "active" : ""}`}
                    onClick={() => setActiveTab("report")}
                >
                    Report
                </div>

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