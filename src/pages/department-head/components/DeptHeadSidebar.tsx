import type { UserResponse } from "../../../types/user.types";

type DHTabType = "leave" | "ot";

interface Props {
    activeTab: DHTabType;
    setActiveTab: (tab: DHTabType) => void;
    profile: UserResponse | null;
    onLogout: () => void;
}

export default function DeptHeadSidebar({ activeTab, setActiveTab, profile, onLogout }: Props) {
    return (
        <aside className="dh-sidebar">
            <div className="dh-sidebar-header">
                <div className="dh-logo-title">SkyCorp HRM</div>
                <div className="dh-logo-subtitle">DEPARTMENT HEAD</div>
            </div>

            <nav className="dh-nav-menu">
                {/* Leave Approval */}
                <div
                    className={`dh-nav-item ${activeTab === "leave" ? "active" : ""}`}
                    onClick={() => setActiveTab("leave")}
                >
                    <svg className="dh-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <polyline points="9 16 11 18 15 14" />
                    </svg>
                    Leave Management
                </div>

                {/* OT Approval */}
                <div
                    className={`dh-nav-item ${activeTab === "ot" ? "active" : ""}`}
                    onClick={() => setActiveTab("ot")}
                >
                    <svg className="dh-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    OT Management
                </div>
            </nav>

            <div className="dh-sidebar-footer">
                <div className="dh-user-profile">
                    <div className="dh-user-avatar">
                        {profile?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="dh-user-meta">
                        <div className="dh-user-name-row">
                            <span className="dh-user-name">{profile?.fullName ?? "User"}</span>
                            <button className="dh-logout-btn" onClick={onLogout} title="Logout">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                        <div className="dh-user-role">{profile?.role ?? "Department Head"}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
