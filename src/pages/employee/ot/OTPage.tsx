import { useState } from "react";
import "../home/home.css";
import PersonalOTView from "../../../components/ot/PersonalOTView";
import ManagerOTView from "../../../components/ot/ManagerOTView";
import CreateOTPlanView from "../../../components/ot/CreateOTPlanView";

interface OTManagementPageProps {
    userId: string;
}

export default function OTManagementPage({ userId }: OTManagementPageProps) {
    const [viewMode, setViewMode] = useState<"personal" | "manager" | "create_plan">("personal");
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span className="current">OT Management</span>
                    </div>
                    <h1 className="page-title">
                        {viewMode === "personal" ? "My OT Schedule" : viewMode === "create_plan" ? "Create Plan" : "Department OT Plans"}
                    </h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, visibility: viewMode === "create_plan" ? "hidden" : "visible" }}>
                    {/* View Toggle */}
                    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 4 }}>
                        <button
                            onClick={() => setViewMode("personal")}
                            style={{
                                padding: "6px 16px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                background: viewMode === "personal" ? "white" : "transparent",
                                color: viewMode === "personal" ? "#3B82F6" : "#64748B",
                                boxShadow: viewMode === "personal" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            }}
                        >
                            Personal View
                        </button>
                        <button
                            onClick={() => setViewMode("manager")}
                            style={{
                                padding: "6px 16px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                background: viewMode === "manager" ? "white" : "transparent",
                                color: viewMode === "manager" ? "#3B82F6" : "#64748B",
                                boxShadow: viewMode === "manager" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            }}
                        >
                            Manager View
                        </button>
                    </div>
                </div>
            </div>

            <div className="content-section">
                {viewMode === "personal" ? (
                    <PersonalOTView userId={userId} />
                ) : viewMode === "manager" ? (
                    <ManagerOTView userId={userId} onCreatePlan={() => setViewMode("create_plan")} />
                ) : (
                    <CreateOTPlanView
                        userId={userId}
                        onCancel={() => setViewMode("manager")}
                        onSubmitSuccess={() => setViewMode("manager")}
                    />
                )}
            </div>
        </div>
    );
}