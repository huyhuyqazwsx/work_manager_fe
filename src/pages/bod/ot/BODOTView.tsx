import React, { useEffect, useState } from "react";
import type { OTPlan } from "../../../types/ot.types";
import type { Department } from "../../../types/department.types";
import { otPlanApi } from "../../../features/ot-plan/api/otPlanApi";
import { departmentApi } from "../../../features/department/api/departmentApi";
import { parseBackendError } from "../../../utils/error.utils";
import { toast } from "../../../components/toast/toast";

interface BODOTViewProps {
    userId: string;
}

export default function BODOTView({ userId }: BODOTViewProps) {
    const [plans, setPlans] = useState<OTPlan[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<string | null>(null); // planId
    const [rejectNote, setRejectNote] = useState("");

    const fetchPlans = () => {
        setLoading(true);
        otPlanApi.getPendingPlans()
            .then(data => setPlans(data))
            .catch(err => console.error("Failed to fetch OT plans", err))
            .finally(() => setLoading(false));
    };

    const fetchDepartments = () => {
        departmentApi.findAll().then(setDepartments).catch(() => { });
    };

    useEffect(() => {
        fetchPlans();
        fetchDepartments();
    }, [userId]);

    const filteredPlans = plans.filter(p => {
        if (departmentFilter === "all") return true;
        return p.departmentId === departmentFilter;
    });

    const totalPages = Math.ceil(filteredPlans.length / limit);
    const paginatedPlans = filteredPlans.slice((page - 1) * limit, page * limit);

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

    const handleApprove = async (planId: string) => {
        setActionLoading(true);
        try {
            await otPlanApi.approvePlan(planId, userId);
            setPlans(prev => prev.filter(p => p.id !== planId));
            toast.success("OT Plan đã được duyệt.");
        } catch (err: any) {
            toast.error(parseBackendError(err, "Duyệt thất bại."));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return;
        if (!rejectNote.trim()) { toast.error("Vui lòng nhập lý do từ chối."); return; }
        setActionLoading(true);
        try {
            await otPlanApi.rejectPlan(rejectTarget, userId, rejectNote.trim());
            setPlans(prev => prev.filter(p => p.id !== rejectTarget));
            toast.success("OT Plan đã bị từ chối.");
            setRejectTarget(null);
            setRejectNote("");
        } catch (err: any) {
            toast.error(parseBackendError(err, "Từ chối thất bại."));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ marginTop: 24 }}>
            {/* Header + Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, flex: 1 }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--dh-gray-400)" }}>🔍</span>
                        <input type="text" placeholder="Search by ID or Reason" style={{ padding: "8px 12px 8px 36px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <select 
                        value={departmentFilter}
                        onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, minWidth: 160 }}
                    >
                        <option value="all">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="dh-table-card" style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--dh-gray-200)" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Overtime Plans Queue</h3>
                </div>
                <div className="dh-table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="dh-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>No</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Department & Plan ID</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Reason / Content</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Date Range</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>Loading...</div>
                                    </td>
                                </tr>
                            ) : paginatedPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "var(--dh-gray-400)" }}>No pending plans found</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedPlans.map((p, idx) => {
                                    return (
                                        <tr key={p.id} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                            <td style={{ padding: "16px 20px", color: "var(--dh-gray-500)", fontWeight: 500 }}>
                                                {String((page - 1) * limit + idx + 1).padStart(2, '0')}
                                            </td>
                                            <td style={{ padding: "16px 20px", fontSize: 13 }}>
                                                <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>
                                                    {departments.find(d => d.id === p.departmentId)?.name || p.departmentId}
                                                </div>
                                                <div style={{ color: "#3B82F6", fontSize: 11 }}>#{p.id.slice(0, 8).toUpperCase()}</div>
                                            </td>
                                            <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-900)" }}>
                                                {p.reason}
                                            </td>
                                            <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-700)" }}>
                                                {new Date(p.startDate).toLocaleDateString('en-GB')} - {new Date(p.endDate).toLocaleDateString('en-GB')}
                                            </td>
                                            <td style={{ padding: "16px 20px" }}>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button onClick={() => handleApprove(p.id)} disabled={actionLoading} style={{ background: "#D1FAE5", color: "#065F46", padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => { setRejectTarget(p.id); setRejectNote(""); }} disabled={actionLoading} style={{ background: "#FEE2E2", color: "#991B1B", padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                                                        ✕ Reject
                                                    </button>
                                                </div>
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
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, plans.length)} of {plans.length} results
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

            {/* ── Reject reason modal ── */}
            {rejectTarget && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
                        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Reject OT Plan</h3>
                        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--dh-gray-500)" }}>Vui lòng nhập lý do từ chối để thông báo cho trưởng phòng.</p>
                        <textarea
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            rows={4}
                            style={{ width: "100%", borderRadius: 8, border: "1px solid var(--dh-gray-200)", padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} disabled={actionLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", color: "var(--dh-gray-700)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                                Huỷ
                            </button>
                            <button onClick={handleRejectConfirm} disabled={actionLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontWeight: 600, fontSize: 13, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
