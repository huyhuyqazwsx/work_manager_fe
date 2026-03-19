import type { UserResponse } from "../../../types/user.types";
import { useNavigate } from "react-router-dom";

interface Props {
    pathname: string;
    profile: UserResponse | null;
    onLogout: () => void;
}

export default function BODSidebar({
    pathname,
    profile,
    onLogout,
}: Props) {
    const navigate = useNavigate();
    const isSettings = pathname.startsWith("/bod/settings");
    const isLeave = pathname === "/bod/leave" || pathname.startsWith("/bod/leave/");
    const isOt = pathname === "/bod/ot" || pathname.startsWith("/bod/ot/");
    const isRoles = pathname === "/bod/roles" || pathname.startsWith("/bod/roles/");
    const activeSettingsTab =
        pathname.includes("/bod/settings/leave-policy") ? "leave" :
            pathname.includes("/bod/settings/holiday") ? "holiday" : "ot";

    return (
        <aside className="dh-sidebar">
            <div className="dh-sidebar-header">
                <div className="dh-logo-title">SkyCorp HRM</div>
                <div className="dh-logo-subtitle" style={{ fontSize: 11, color: "var(--dh-gray-400)" }}>ENTERPRISE</div>
            </div>

            <nav className="dh-nav-menu">
                {/* Leave Management */}
                <div
                    className={`dh-nav-item ${isLeave ? "active" : ""}`}
                    onClick={() => navigate("/bod/leave")}
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

                {/* OT Management */}
                <div
                    className={`dh-nav-item ${isOt ? "active" : ""}`}
                    onClick={() => navigate("/bod/ot")}
                >
                    <svg className="dh-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    OT Management
                </div>

                {/* Role Management */}
                <div
                    className={`dh-nav-item ${isRoles ? "active" : ""}`}
                    onClick={() => navigate("/bod/roles")}
                >
                    <svg className="dh-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Role Management
                </div>

                {/* Settings */}
                <div
                    className={`dh-nav-item ${isSettings ? "active" : ""}`}
                    onClick={() => navigate("/bod/settings/ot-rules")}
                >
                    <svg className="dh-nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Settings
                </div>

                {isSettings && (
                    <div className="dh-nav-submenu">
                        <div
                            className={`dh-nav-subitem ${activeSettingsTab === "ot" ? "active" : ""}`}
                            onClick={() => navigate("/bod/settings/ot-rules")}
                        >
                            OT Rules
                        </div>
                        <div
                            className={`dh-nav-subitem ${activeSettingsTab === "leave" ? "active" : ""}`}
                            onClick={() => navigate("/bod/settings/leave-policy")}
                        >
                            Leave Policy
                        </div>
                        <div
                            className={`dh-nav-subitem ${activeSettingsTab === "holiday" ? "active" : ""}`}
                            onClick={() => navigate("/bod/settings/holiday")}
                        >
                            Holiday
                        </div>
                    </div>
                )}
            </nav>

            <div className="dh-sidebar-footer">
                <div className="dh-user-profile">
                    <div className="dh-user-avatar">
                        {profile?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="dh-user-meta">
                        <div className="dh-user-name-row">
                            <span className="dh-user-name" style={{ fontSize: 14, fontWeight: 700 }}>{profile?.fullName ?? "User"}</span>
                            <button className="dh-logout-btn" onClick={onLogout} title="Logout">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                        <div className="dh-user-role" style={{ fontSize: 12, color: "var(--dh-gray-500)" }}>{profile?.role ?? "BOD"}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
