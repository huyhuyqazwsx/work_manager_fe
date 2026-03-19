import { useEffect, useState } from "react";
import { reportApi } from "../../../features/report/api/reportApi";
import type { LeaveReportItem } from "../../../features/report/api/reportApi";
import { departmentApi } from "../../../features/department/api/departmentApi";
import { leaveTypeApi } from "../../../features/leave-type/api/leaveTypeApi";
import { userApi } from "../../../features/user/api/userApi";
import type { Department } from "../../../types/department.types";
import type { LeaveType } from "../../../types/leave-type.types";
import type { UserResponse } from "../../../types/user.types";
import { LeaveRequestStatus } from "../../../types/enum/enum";
import { toast } from "../../../components/toast/toast";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    APPROVED:  { bg: "#F0FDF4", color: "#166534" },
    PENDING:   { bg: "#FFFBEB", color: "#92400E" },
    REJECTED:  { bg: "#FEF2F2", color: "#991B1B" },
    CANCELLED: { bg: "#F1F5F9", color: "#475569" },
    DRAFT:     { bg: "#F1F5F9", color: "#475569" },
};

function statusBadge(status: string) {
    const s = STATUS_COLORS[status] ?? { bg: "#F1F5F9", color: "#475569" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}

function fmtDate(d?: string) {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

export default function LeaveReportView() {
    const [items, setItems] = useState<LeaveReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

    // Lookup maps built from static data
    const [deptIdMap, setDeptIdMap] = useState<Record<string, string>>({});         // id → name
    const [leaveTypeMap, setLeaveTypeMap] = useState<Record<string, string>>({});   // code → name
    const [userMap, setUserMap] = useState<Record<string, UserResponse>>({});       // id → user

    // Filters
    const [search, setSearch] = useState("");
    const [deptId, setDeptId] = useState("");
    const [leaveTypeCode, setLeaveTypeCode] = useState("");
    const [status, setStatus] = useState("");
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR);
    const [useMonthFilter, setUseMonthFilter] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const [exportingMonthly, setExportingMonthly] = useState(false);
    const [exportingYearly, setExportingYearly] = useState(false);

    useEffect(() => {
        Promise.all([departmentApi.findAll(), leaveTypeApi.findAll(), userApi.findAll()])
            .then(([depts, types, users]) => {
                setDepartments(depts);
                setLeaveTypes(types);

                const dm: Record<string, string> = {};
                depts.forEach(d => { dm[d.id] = d.name; });
                setDeptIdMap(dm);

                const lm: Record<string, string> = {};
                types.forEach(lt => { lm[lt.code] = lt.name; });
                setLeaveTypeMap(lm);

                const um: Record<string, UserResponse> = {};
                users.forEach(u => { um[u.id] = u; });
                setUserMap(um);
            })
            .catch(() => {});
        fetchData(1);
    }, []);

    useEffect(() => { fetchData(1); setPage(1); }, [deptId, leaveTypeCode, status, useMonthFilter, filterMonth, filterYear]);

    const buildDateRange = () => {
        if (!useMonthFilter) return {};
        const from = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(filterYear, filterMonth, 0).getDate();
        const to = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        return { fromDate: from, toDate: to };
    };

    const fetchData = async (p = page) => {
        setLoading(true);
        try {
            const res = await reportApi.getLeaveReport({
                search: search || undefined,
                departmentId: deptId || undefined,
                leaveTypeCode: leaveTypeCode || undefined,
                status: (status as LeaveRequestStatus) || undefined,
                ...buildDateRange(),
                page: p,
                limit,
            });
            setItems(res.data ?? []);
            setTotal(res.pagination?.total ?? 0);
            setTotalPages(res.pagination?.totalPages ?? 1);
        } catch {
            toast.error("Tải dữ liệu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => { setPage(1); fetchData(1); };

    const handleExportMonthly = async () => {
        setExportingMonthly(true);
        try {
            await reportApi.exportLeaveMonthly(filterMonth, filterYear);
            toast.success(`Xuất báo cáo tháng ${filterMonth}/${filterYear} thành công.`);
        } catch {
            toast.error("Xuất file thất bại.");
        } finally {
            setExportingMonthly(false);
        }
    };

    const handleExportYearly = async () => {
        setExportingYearly(true);
        try {
            await reportApi.exportLeaveYearly(filterYear);
            toast.success(`Xuất báo cáo năm ${filterYear} thành công.`);
        } catch {
            toast.error("Xuất file thất bại.");
        } finally {
            setExportingYearly(false);
        }
    };

    const handleClear = () => {
        setSearch(""); setDeptId(""); setLeaveTypeCode(""); setStatus("");
        setUseMonthFilter(false);
        setFilterMonth(new Date().getMonth() + 1);
        setFilterYear(CURRENT_YEAR);
        setPage(1);
    };

    const hasFilter = search || deptId || leaveTypeCode || status || useMonthFilter;

    const thStyle: React.CSSProperties = {
        padding: "11px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        color: "#94A3B8", background: "#F8FAFC", whiteSpace: "nowrap", letterSpacing: "0.05em",
        textAlign: "left",
    };
    const tdStyle: React.CSSProperties = {
        padding: "13px 14px", fontSize: 13, color: "#0F172A",
        borderBottom: "1px solid #F1F5F9", verticalAlign: "middle",
    };

    const goPage = (p: number) => { setPage(p); fetchData(p); };

    return (
        <div style={{ padding: "24px 32px" }}>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>Home / Report / Leave Management</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Leave Report</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleExportMonthly} disabled={exportingMonthly}
                        title={`Export tháng ${filterMonth}/${filterYear}`}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "1px solid #166534", background: "white", color: "#166534", fontSize: 13, fontWeight: 600, cursor: exportingMonthly ? "not-allowed" : "pointer", opacity: exportingMonthly ? 0.7 : 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {exportingMonthly ? "..." : `Export ${MONTHS.find(m => m.value === filterMonth)?.label ?? filterMonth}/${filterYear}`}
                    </button>
                    <button onClick={handleExportYearly} disabled={exportingYearly}
                        title={`Export năm ${filterYear}`}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: "#166534", color: "white", fontSize: 13, fontWeight: 600, cursor: exportingYearly ? "not-allowed" : "pointer", opacity: exportingYearly ? 0.7 : 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {exportingYearly ? "..." : `Export ${filterYear}`}
                    </button>
                </div>
            </div>

            {/* Filter row 1 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
                        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder="Search employee..."
                        style={{ padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, width: 220, outline: "none" }} />
                </div>

                <select value={deptId} onChange={e => setDeptId(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white", minWidth: 160 }}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <select value={leaveTypeCode} onChange={e => setLeaveTypeCode(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white", minWidth: 160 }}>
                    <option value="">All Leave Type</option>
                    {leaveTypes.map(lt => <option key={lt.id} value={lt.code}>{lt.name}</option>)}
                </select>

                {hasFilter && (
                    <button onClick={handleClear}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: "pointer", color: "#64748B" }}>
                        Clear
                    </button>
                )}
            </div>

            {/* Filter row 2 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <select value={status} onChange={e => setStatus(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white", minWidth: 140 }}>
                    <option value="">All Status</option>
                    {Object.values(LeaveRequestStatus).map(s => (
                        <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                    ))}
                </select>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B", cursor: "pointer" }}>
                    <input type="checkbox" checked={useMonthFilter} onChange={e => setUseMonthFilter(e.target.checked)}
                        style={{ width: 15, height: 15, cursor: "pointer" }} />
                    Filter by month
                </label>

                {useMonthFilter && (
                    <>
                        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #3B82F6", fontSize: 13, background: "white", outline: "none" }}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #3B82F6", fontSize: 13, background: "white", outline: "none" }}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </>
                )}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                            <th style={{ ...thStyle, textAlign: "center", width: 48 }}>NO</th>
                            <th style={thStyle}>PERIOD</th>
                            <th style={{ ...thStyle, width: 80 }}>CODE</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>DEPARTMENT</th>
                            <th style={thStyle}>LEAVE TYPE</th>
                            <th style={thStyle}>REASON</th>
                            <th style={{ ...thStyle, textAlign: "center" }}>DURATION</th>
                            <th style={thStyle}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "#94A3B8" }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "#94A3B8" }}>No records found.</td></tr>
                        ) : items.map((item, idx) => {
                            const creator = userMap[item.createdBy];
                            const deptName = item.departmentId
                                ? (deptIdMap[item.departmentId] ?? item.departmentId)
                                : (creator?.departmentCode ? (deptIdMap[creator.departmentCode] ?? creator.departmentCode) : "—");
                            const ltName = item.leaveTypeCode ? (leaveTypeMap[item.leaveTypeCode] ?? item.leaveTypeCode) : "—";
                            const fromSame = item.fromDate?.slice(0, 10) === item.toDate?.slice(0, 10);

                            return (
                                <tr key={item.id}>
                                    <td style={{ ...tdStyle, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                                        {String((page - 1) * limit + idx + 1).padStart(2, "0")}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: 12, whiteSpace: "nowrap", color: "#1D4ED8" }}>
                                        {fromSame ? fmtDate(item.fromDate) : `${fmtDate(item.fromDate)} – ${fmtDate(item.toDate)}`}
                                    </td>
                                    <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                                        {creator?.code ?? "—"}
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{creator?.fullName ?? "—"}</td>
                                    <td style={{ ...tdStyle, color: "#475569" }}>{deptName}</td>
                                    <td style={{ ...tdStyle, color: "#475569" }}>{ltName}</td>
                                    <td style={{ ...tdStyle, color: "#475569", maxWidth: 160 }}>
                                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.reason ?? "—"}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                                        {item.totalDays != null ? `${item.totalDays} Day${item.totalDays !== 1 ? "s" : ""}` : "—"}
                                    </td>
                                    <td style={tdStyle}>{statusBadge(item.status)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <div style={{ fontSize: 13, color: "#94A3B8" }}>
                    {total === 0 ? "No results" : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} results`}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => goPage(1)} disabled={page === 1}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#CBD5E1" : "#0F172A" }}>«</button>
                    <button onClick={() => goPage(page - 1)} disabled={page === 1}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#CBD5E1" : "#0F172A" }}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => (
                            <>
                                {i > 0 && arr[i - 1] !== p - 1 && (
                                    <span key={`dot-${p}`} style={{ padding: "6px 4px", color: "#94A3B8", lineHeight: "32px" }}>…</span>
                                )}
                                <button key={p} onClick={() => goPage(p)}
                                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", borderColor: p === page ? "#1E3A8A" : "#E2E8F0", background: p === page ? "#1E3A8A" : "white", color: p === page ? "white" : "#0F172A", fontWeight: p === page ? 700 : 400 }}>
                                    {p}
                                </button>
                            </>
                        ))}
                    <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#CBD5E1" : "#0F172A" }}>›</button>
                    <button onClick={() => goPage(totalPages)} disabled={page === totalPages}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#CBD5E1" : "#0F172A" }}>»</button>
                </div>
            </div>
        </div>
    );
}
