import { parseBackendError } from "../../utils/error.utils";
import React, { useEffect, useState } from "react";
import { leaveApi } from "../../features/leave/api/leaveApi";
import { leaveTypeApi } from "../../features/leave-type/api/leaveTypeApi";
import NewLeaveRequestModal from "./NewLeaveRequestModal";
import type { LeaveRequest, PaginatedLeaveRequests, AnnualLeaveDashboardDto } from "../../types/leave.types";
import type { LeaveType } from "../../types/leave-type.types";
import LeaveRequestDetailsModal from "./LeaveRequestDetailsModal";

/* ─── Helpers ─────────────────────────────────────────── */
function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
};

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

interface PersonalLeaveViewProps {
    userId: string;
}

/* ─── Shared Component ───────────────────────────────────────── */
export default function PersonalLeaveView({ userId }: PersonalLeaveViewProps) {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveTypesLoading, setLeaveTypesLoading] = useState(true);
    /* ── State ── */
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [myLoading, setMyLoading] = useState(true);
    const [myError, setMyError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState<PaginatedLeaveRequests["pagination"] | null>(null);

    const [annualDashboard, setAnnualDashboard] = useState<AnnualLeaveDashboardDto | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const [showNewRequest, setShowNewRequest] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    /* ─── Fetch data ─── */
    const fetchMyRequests = async (uid: string, p: number = page) => {
        if (!uid) return;
        setMyLoading(true);
        setMyError(null);
        try {
            const result = await leaveApi.getMyLeaveRequests(uid, p, limit);
            setMyRequests(result.data);
            setPagination(result.pagination);
        } catch (err: any) {
            setMyError(parseBackendError(err, err.message));
        } finally {
            setMyLoading(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (cancellingId) return;
        if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
        setCancellingId(requestId);
        try {
            await leaveApi.cancel(requestId, userId);
            void fetchMyRequests(userId, page);
            void fetchBalances(userId);
        } catch (err: any) {
            alert(parseBackendError(err, err.message ?? "Failed to cancel request."));
        } finally {
            setCancellingId(null);
        }
    };

    const fetchBalances = async (uid: string) => {
        if (!uid) return;
        setBalanceLoading(true);
        try {
            const dash = await leaveApi.getAnnualLeaveDashboard(uid);
            setAnnualDashboard(dash);
        } catch {
            // ignore balance errors silently
        } finally {
            setBalanceLoading(false);
        }
    };

    useEffect(() => {
        leaveTypeApi.findAll()
            .then(setLeaveTypes)
            .catch(() => {})
            .finally(() => setLeaveTypesLoading(false));
    }, []);

    useEffect(() => {
        void fetchMyRequests(userId, page);
        void fetchBalances(userId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, page]);

    const getLeaveTypeName = (leaveTypeCode: string | null) => {
        if (!leaveTypeCode) return "—";
        const lt = leaveTypes.find((l) => l.code === leaveTypeCode);
        return lt?.name ?? leaveTypeCode.slice(0, 8) + "…";
    };

    /* ══════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════ */
    if (leaveTypesLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: "var(--dh-gray-500)" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ width: 24, height: 24, border: "3px solid var(--dh-gray-200)", borderTopColor: "var(--dh-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: 12 }} />
                Loading leave data...
            </div>
        );
    }

    return (
        <div style={{ marginTop: 24 }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            {/* ── Header Area ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                {/* + New Request */}
                <button
                    onClick={() => setShowNewRequest(true)}
                    style={{
                        padding: "9px 18px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                    }}
                >
                    + New Request
                </button>
            </div>

            {myError && (
                <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#991B1B", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
                    ⚠ {myError}
                </div>
            )}

            {/* ── Balance Dashboard ── */}
            {(() => {
                const d = annualDashboard;
                const compHours = d?.compensationHours?.toFixed(1) ?? "—";

                return (
                    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                        {/* Current Balance */}
                        <div style={{
                            background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                            borderRadius: 20,
                            padding: "28px 32px",
                            color: "white",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            minHeight: 140,
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
                                Current Balance
                            </div>
                            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>
                                {balanceLoading ? "—" : d
                                    ? `${d.remainingPaidDays} / ${d.totalAllowedDays}`
                                    : "—"
                                }
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 500, opacity: 0.8, marginTop: 6 }}>Days (Annual Leave)</div>
                            {!balanceLoading && d && d.pendingDays > 0 && (
                                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                                        {d.pendingDays} day{d.pendingDays !== 1 ? "s" : ""} pending
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Used Annual & Unpaid */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{
                                background: "white", border: "1px solid var(--dh-gray-200)", borderRadius: 16, padding: "16px 20px", flex: 1,
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dh-gray-500)", marginBottom: 6 }}>Used Annual Leave</div>
                                        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--dh-gray-900)" }}>{balanceLoading ? "—" : `${d?.usedPaidDays ?? 0} Days`}</div>
                                    </div>
                                    <span style={{ fontSize: 22, opacity: 0.5 }}>✈</span>
                                </div>
                            </div>

                            <div style={{
                                background: "white", border: "1px solid var(--dh-gray-200)", borderRadius: 16, padding: "16px 20px", flex: 1,
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dh-gray-500)", marginBottom: 6 }}>
                                            Unpaid<span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4 }}>Used this year</span>
                                        </div>
                                        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--dh-gray-900)" }}>{balanceLoading ? "—" : `${d?.usedUnpaidDays ?? 0} Days`}</div>
                                    </div>
                                    <span style={{ fontSize: 22, opacity: 0.4 }}>📋</span>
                                </div>
                            </div>
                        </div>

                        {/* Compensatory Fund */}
                        <div style={{
                            background: "white", border: "1px solid var(--dh-gray-200)", borderRadius: 16, padding: "20px 24px",
                            display: "flex", flexDirection: "column", justifyContent: "center",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dh-gray-500)" }}>Compensatory Fund</div>
                                <span style={{ fontSize: 20, opacity: 0.5 }}>🕐</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 36, fontWeight: 800, color: "#10B981", letterSpacing: "-0.02em" }}>
                                    {balanceLoading ? "—" : `+${compHours}`}
                                </span>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, background: "#D1FAE5", color: "#065F46", borderRadius: 6, padding: "2px 7px",
                                }}>HOURS</span>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--dh-gray-400)" }}>
                                {d && d.compensationHours > 0 ? `${d.compensationHours} hours available` : "No compensatory hours"}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Request Table ── */}
            <div className="dh-table-card" style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden" }}>
                <div className="dh-table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="dh-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>No</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Request ID</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Period</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Duration</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Leave Type</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myLoading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>Loading requests...</div>
                                    </td>
                                </tr>
                            ) : myRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div style={{ padding: 60, textAlign: "center", color: "var(--dh-gray-400)" }}>
                                            <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--dh-gray-900)", marginBottom: 4 }}>No personal leave requests</div>
                                            <div style={{ fontSize: 14 }}>You have not submitted any leave requests yet.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                myRequests.map((req, idx) => (
                                    <tr key={req.id} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                        <td style={{ padding: "16px 20px", color: "var(--dh-gray-500)", fontWeight: 500, width: 48 }}>
                                            {String((page - 1) * limit + idx + 1).padStart(2, "0")}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                style={{ border: "none", background: "none", padding: 0, margin: 0, textDecoration: "underline", cursor: "pointer" }}
                                            >
                                                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--dh-primary)", fontWeight: 600, wordBreak: "break-all" }}>
                                                    {req.id.slice(0, 13).toUpperCase()}
                                                </span>
                                            </button>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ fontWeight: 500, fontSize: 13, color: "var(--dh-gray-900)" }}>
                                                {req.fromDate ? formatDate(req.fromDate) : "—"}
                                                {req.fromDate && req.toDate && req.fromDate !== req.toDate ? ` – ${formatDate(req.toDate)}` : ""}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--dh-gray-500)", marginTop: 2 }}>
                                                {new Date(req.fromDate) > new Date() ? "Upcoming" : "Past"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-700)", fontWeight: 500 }}>
                                            {req.totalDays} {req.totalDays === 1 ? "Day" : "Days"}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ background: "var(--dh-gray-100)", color: "var(--dh-gray-700)", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                                                {getLeaveTypeName(req.leaveTypeCode)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                                                background: req.status === "APPROVED" ? "#D1FAE5" : req.status === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                                                color: req.status === "APPROVED" ? "#065F46" : req.status === "REJECTED" ? "#991B1B" : "#92400E",
                                            }}>
                                                {STATUS_LABELS[req.status] ?? req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination Footer ── */}
                {pagination && pagination.totalPages > 0 && (
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "14px 20px", borderTop: "1px solid var(--dh-gray-200)",
                        background: "white",
                    }}>
                        <span style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
                        </span>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            {/* First */}
                            <button
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                style={paginationBtnStyle(false, page === 1)}
                            >⟨⟨</button>
                            {/* Prev */}
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={paginationBtnStyle(false, page === 1)}
                            >⟨</button>
                            {/* Page numbers */}
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${i}`} style={{ padding: "0 6px", color: "var(--dh-gray-400)", fontSize: 13 }}>…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p as number)}
                                            style={paginationBtnStyle(page === p, false)}
                                        >{p}</button>
                                    )
                                )
                            }
                            {/* Next */}
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                style={paginationBtnStyle(false, page === pagination.totalPages)}
                            >⟩</button>
                            {/* Last */}
                            <button
                                onClick={() => setPage(pagination.totalPages)}
                                disabled={page === pagination.totalPages}
                                style={paginationBtnStyle(false, page === pagination.totalPages)}
                            >⟩⟩</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Request Modal ───────────────── */}
            {showNewRequest && (
                <NewLeaveRequestModal
                    userId={userId}
                    onClose={() => setShowNewRequest(false)}
                    onSubmitted={() => {
                        setShowNewRequest(false);
                        void fetchMyRequests(userId);
                        void fetchBalances(userId);
                    }}
                />
            )}

            {/* ── Request Details Modal ───────────── */}
            {selectedRequest && (
                <LeaveRequestDetailsModal
                    request={selectedRequest}
                    leaveTypeName={getLeaveTypeName(selectedRequest.leaveTypeCode)}
                    onClose={() => setSelectedRequest(null)}
                    onCancel={(id) => {
                        handleCancel(id);
                        setSelectedRequest(null);
                    }}
                    cancellingId={cancellingId}
                />
            )}
        </div>
    );
}
