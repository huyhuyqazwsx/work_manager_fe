import React, { useEffect, useState } from "react";
import type { OTPlan } from "../../types/ot.types";
import { otPlanApi } from "../../features/ot-plan/api/otPlanApi";
import { userApi } from "../../features/user/api/userApi";
import OTPlanDetailView from "./OTPlanDetailView";

interface ManagerOTViewProps {
    userId: string;
    onCreatePlan?: () => void;
}

export default function ManagerOTView({ userId, onCreatePlan }: ManagerOTViewProps) {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [plans, setPlans] = useState<OTPlan[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({}); // code → fullName
    const [userIdMap, setUserIdMap] = useState<Record<string, string>>({}); // userId → fullName
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Applied filter values (only update on search/apply)
    const [appliedSearch, setAppliedSearch] = useState("");
    const [appliedStatus, setAppliedStatus] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");

    // Preload department employees once on mount
    useEffect(() => {
        if (!userId) return;
        userApi.getUsersByUserOfDepartment(userId)
            .then(users => {
                const codeMap: Record<string, string> = {};
                const idMap: Record<string, string> = {};
                users.forEach(u => {
                    if (u.code) codeMap[u.code] = u.fullName;
                    idMap[u.id] = u.fullName;
                });
                setEmployeeMap(codeMap);
                setUserIdMap(idMap);
            })
            .catch(console.error);
    }, [userId]);

    const fetchPlans = (pg: number) => {
        if (!userId) return;
        setLoading(true);
        otPlanApi.getMyPlans(userId, pg, limit, appliedStatus || undefined, appliedFrom || undefined, appliedTo || undefined, appliedSearch || undefined)
            .then(res => {
                setPlans(res.data);
                setTotalPages(res.pagination.totalPages);
                setTotal(res.pagination.total);
            })
            .catch(err => console.error("Failed to fetch OT plans", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPlans(page); }, [userId, page, appliedSearch, appliedStatus, appliedFrom, appliedTo]);

    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedStatus(statusFilter);
        setPage(1);
    };

    const handleClear = () => {
        setSearch(""); setStatusFilter(""); setFromDate(""); setToDate("");
        setAppliedSearch(""); setAppliedStatus(""); setAppliedFrom(""); setAppliedTo("");
        setShowDateFilter(false);
        setPage(1);
    };

    const handleApplyDate = () => {
        setAppliedFrom(fromDate);
        setAppliedTo(toDate);
        setShowDateFilter(false);
        setPage(1);
    };

    const paginatedPlans = plans;

    if (selectedPlanId) {
        return (
            <OTPlanDetailView
                planId={selectedPlanId}
                userId={userId}
                employeeMap={employeeMap}
                userIdMap={userIdMap}
                onBack={() => setSelectedPlanId(null)}
                onRefresh={() => fetchPlans(page)}
            />
        );
    }

    const paginationBtnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
        minWidth: 32,
        height: 32,
        padding: "0 8px",
        border: active ? "none" : "1px solid var(--dh-gray-200)",
        borderRadius: 8,
        background: active ? "var(--dh-primary, #3B82F6)" : "white",
        color: active ? "white" : disabled ? "var(--dh-gray-300)" : "var(--dh-gray-700)",
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "APPROVED":
                return { bg: "#D1FAE5", color: "#065F46" };
            case "REJECTED":
                return { bg: "#FEE2E2", color: "#991B1B" };
            case "DRAFT":
                return { bg: "#F1F5F9", color: "#475569" };
            default: // PENDING
                return { bg: "#FEF3C7", color: "#92400E" };
        }
    };

    return (
        <div style={{ marginTop: 24 }}>
            {/* Header + Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                {/* Notice that the Title is already handled by OTPage, but we can do filters here */}
                <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {/* Search input */}
                    <div style={{ position: "relative", width: "100%", maxWidth: 280 }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--dh-gray-400)", fontSize: 14 }}>🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                            placeholder="Search by ID or Reason"
                            style={{ padding: "8px 12px 8px 36px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setAppliedStatus(e.target.value); setPage(1); }}
                        style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${statusFilter ? "#3B82F6" : "var(--dh-gray-200)"}`, outline: "none", fontSize: 14, minWidth: 140, background: statusFilter ? "#EFF6FF" : "white", color: statusFilter ? "#1D4ED8" : "inherit" }}
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="DRAFT">Draft</option>
                    </select>

                    {/* Date range filter */}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => setShowDateFilter(v => !v)}
                            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${appliedFrom || appliedTo ? "#3B82F6" : "var(--dh-gray-200)"}`, background: appliedFrom || appliedTo ? "#EFF6FF" : "white", cursor: "pointer", fontSize: 14, color: appliedFrom || appliedTo ? "#1D4ED8" : "var(--dh-gray-700)", display: "flex", alignItems: "center", gap: 6 }}
                        >
                            📅 {appliedFrom && appliedTo ? `${appliedFrom} → ${appliedTo}` : "Date range"}
                        </button>
                        {showDateFilter && (
                            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: "white", border: "1px solid var(--dh-gray-200)", borderRadius: 10, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 10, minWidth: 280 }}>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--dh-gray-500)", display: "block", marginBottom: 4 }}>FROM</label>
                                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--dh-gray-200)", fontSize: 13, boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--dh-gray-500)", display: "block", marginBottom: 4 }}>TO</label>
                                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--dh-gray-200)", fontSize: 13, boxSizing: "border-box" }} />
                                    </div>
                                </div>
                                <button onClick={handleApplyDate} style={{ padding: "8px 0", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Apply</button>
                            </div>
                        )}
                    </div>

                    {/* Search button */}
                    <button onClick={handleSearch} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", cursor: "pointer", fontSize: 14, color: "var(--dh-gray-700)", display: "flex", alignItems: "center", gap: 6 }}>
                        🔍 Search
                    </button>

                    {/* Clear */}
                    {(appliedSearch || appliedStatus || appliedFrom || appliedTo) && (
                        <button onClick={handleClear} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", cursor: "pointer", fontSize: 14, color: "var(--dh-gray-500)", display: "flex", alignItems: "center", gap: 6 }}>
                            🧹 Clear
                        </button>
                    )}
                </div>

                <button onClick={onCreatePlan} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    + Create New Plan
                </button>
            </div>

            {/* Table */}
            <div className="dh-table-card" style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden" }}>
                <div className="dh-table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="dh-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>No</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Plan ID</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Reason / Content</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Date Range</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none", textAlign: "center" }}>Status</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>Loading...</div>
                                    </td>
                                </tr>
                            ) : paginatedPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "var(--dh-gray-400)" }}>No plans found</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedPlans.map((p, idx) => {
                                    const s = getStatusStyle(p.status);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                            <td style={{ padding: "16px 20px", color: "var(--dh-gray-500)", fontWeight: 500 }}>
                                                {String((page - 1) * limit + idx + 1).padStart(2, '0')}
                                            </td>
                                            <td
                                                style={{ padding: "16px 20px", fontWeight: 600, color: "#3B82F6", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
                                                onClick={() => setSelectedPlanId(p.id)}
                                            >
                                                #{p.id.slice(-8).toUpperCase()}
                                            </td>
                                            <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-900)" }}>
                                                {p.reason}
                                            </td>
                                            <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-700)" }}>
                                                {new Date(p.startDate).toLocaleDateString('en-GB')} - {new Date(p.endDate).toLocaleDateString('en-GB')}
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                    background: s.bg, color: s.color,
                                                }}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3B82F6", fontSize: 18 }}>
                                                    👁
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--dh-gray-200)", background: "white" }}>
                        <span style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>
                            Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                        </span>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button onClick={() => setPage(1)} disabled={page === 1} style={paginationBtnStyle(false, page === 1)}>⟨⟨</button>
                            <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} style={paginationBtnStyle(false, page === 1)}>⟨</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pnum => (
                                <button key={pnum} onClick={() => setPage(pnum)} style={paginationBtnStyle(page === pnum, false)}>{pnum}</button>
                            ))}
                            <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages} style={paginationBtnStyle(false, page === totalPages)}>⟩</button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={paginationBtnStyle(false, page === totalPages)}>⟩⟩</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
