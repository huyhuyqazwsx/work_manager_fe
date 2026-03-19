import { useEffect, useState } from "react";
import { reportApi } from "../../../features/report/api/reportApi";
import type { GetOTPlanReportDto } from "../../../features/report/api/reportApi";
import type { OTPlan } from "../../../types/ot.types";
import { departmentApi } from "../../../features/department/api/departmentApi";
import type { Department } from "../../../types/department.types";
import OTPlanDetailView from "../../../components/ot/OTPlanDetailView";
import { userApi } from "../../../features/user/api/userApi";

interface Props {
    userId: string;
}

const fmtDate = (s?: string) => {
    if (!s) return "—";
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
        DRAFT:    { bg: "#F1F5F9", color: "#475569" },
        PENDING:  { bg: "#FEF3C7", color: "#92400E" },
        APPROVED: { bg: "#D1FAE5", color: "#065F46" },
        REJECTED: { bg: "#FEE2E2", color: "#991B1B" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#475569" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {status}
        </span>
    );
};

export default function OTReportView({ userId }: Props) {
    const [plans, setPlans] = useState<OTPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [userIdMap, setUserIdMap] = useState<Record<string, string>>({});

    // Filters
    const [search, setSearch] = useState("");
    const [deptId, setDeptId] = useState("");
    const [status, setStatus] = useState("");
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        departmentApi.findAll().then(setDepartments).catch(() => {});
        userApi.getUsersByUserOfDepartment(userId)
            .then(users => {
                const map: Record<string, string> = {};
                users.forEach(u => { if (u.id) map[u.id] = u.fullName; });
                setUserIdMap(map);
            })
            .catch(() => {});
    }, [userId]);

    const fetchPlans = async (p = page) => {
        setLoading(true);
        try {
            const dto: GetOTPlanReportDto = { page: p, limit };
            if (search.trim()) dto.search = search.trim();
            if (deptId) dto.departmentId = deptId;
            if (status) dto.status = status;
            if (month) dto.month = month;
            const res = await reportApi.getAllOTPlanForHR(dto);
            setPlans(res.data ?? []);
            setTotal(res.pagination?.total ?? 0);
            setTotalPages(res.pagination?.totalPages ?? 1);
        } catch {
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(1); setPage(1); }, [deptId, status, month]);

    const handleSearch = () => { setPage(1); fetchPlans(1); };
    const handleClear = () => { setSearch(""); setDeptId(""); setStatus(""); setMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`); };

    if (selectedPlanId) {
        return (
            <div style={{ padding: "24px 32px" }}>
                <div style={{ fontSize: 12, color: "var(--dh-gray-400)", marginBottom: 8 }}>
                    Home / Report / OT Management / OT Plan
                </div>
                <OTPlanDetailView
                    planId={selectedPlanId}
                    userId={userId}
                    userIdMap={userIdMap}
                    readOnly
                    onBack={() => setSelectedPlanId(null)}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: "24px 32px" }}>
            <div style={{ fontSize: 12, color: "var(--dh-gray-400)", marginBottom: 8 }}>
                Home / Report / OT Management
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#0F172A" }}>OT Plan List</h2>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="Search by ID or Reason..."
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13, width: 260 }}
                />
                <select value={deptId} onChange={e => setDeptId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13 }}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button onClick={handleClear} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", fontSize: 13, cursor: "pointer" }}>
                    Clear
                </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13 }}>
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13 }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid var(--dh-gray-200)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                            {["NO", "PLAN ID", "REASON / CONTENT", "DATE RANGE", "STATUS"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", textAlign: h === "NO" ? "center" : "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--dh-gray-400)" }}>Loading...</td></tr>
                        ) : plans.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--dh-gray-400)" }}>No plans found.</td></tr>
                        ) : plans.map((p, idx) => (
                            <tr key={p.id} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                <td style={{ padding: "14px 16px", textAlign: "center", color: "var(--dh-gray-500)", fontSize: 13 }}>{String(idx + 1 + (page - 1) * limit).padStart(2, "0")}</td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span
                                        onClick={() => setSelectedPlanId(p.id)}
                                        style={{ fontWeight: 700, fontSize: 13, color: "#1E3A8A", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                                    >
                                        OTP-{p.id.slice(-8).toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.reason ?? "—"}</td>
                                <td style={{ padding: "14px 16px", fontSize: 13 }}>
                                    {p.startDate === p.endDate ? fmtDate(p.startDate) : `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}`}
                                </td>
                                <td style={{ padding: "14px 16px" }}>{statusBadge(p.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <span style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>
                    Showing {plans.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                    {[
                        { label: "⟪", action: () => { setPage(1); fetchPlans(1); }, disabled: page === 1 },
                        { label: "‹", action: () => { setPage(p => p - 1); fetchPlans(page - 1); }, disabled: page === 1 },
                        { label: String(page), action: () => {}, disabled: false, active: true },
                        { label: "›", action: () => { setPage(p => p + 1); fetchPlans(page + 1); }, disabled: page >= totalPages },
                        { label: "⟫", action: () => { setPage(totalPages); fetchPlans(totalPages); }, disabled: page >= totalPages },
                    ].map((btn, i) => (
                        <button key={i} onClick={btn.action} disabled={btn.disabled}
                            style={{ minWidth: 32, height: 32, borderRadius: 8, border: (btn as any).active ? "none" : "1px solid var(--dh-gray-200)", background: (btn as any).active ? "#1E3A8A" : "white", color: (btn as any).active ? "white" : btn.disabled ? "var(--dh-gray-300)" : "var(--dh-gray-700)", fontWeight: 600, fontSize: 13, cursor: btn.disabled ? "not-allowed" : "pointer" }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
