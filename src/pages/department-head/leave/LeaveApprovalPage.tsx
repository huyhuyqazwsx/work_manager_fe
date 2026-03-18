import { useEffect, useRef, useState } from "react";
import { leaveApi } from "../../../features/leave/api/leaveApi";
import { leaveTypeApi } from "../../../features/leave-type/api/leaveTypeApi";
import { userApi } from "../../../features/user/api/userApi";
import { departmentApi } from "../../../features/department/api/departmentApi";
import type { LeaveType } from "../../../types/leave-type.types";
import type { Department } from "../../../types/department.types";
import type { LeaveRequest } from "../../../types/leave.types";
import { LeaveRequestStatus } from "../../../types/enum/enum";
import PersonalLeaveView from "../../../components/leave/PersonalLeaveView";
import LeaveRequestDetailsModal from "../../../components/leave/LeaveRequestDetailsModal";
import { parseBackendError } from "../../../utils/error.utils";

/* ─── Helpers ─────────────────────────────────────────── */
function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
};

type ViewTab = "manager" | "personal";

const PAGE_SIZE = 10;

/* ─── Component ───────────────────────────────────────── */
interface LeaveApprovalPageProps {
    isBOD?: boolean;
}

export default function LeaveApprovalPage({ isBOD = false }: LeaveApprovalPageProps) {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");

    const MANAGER_ID: string = profile.id ?? "";

    /* ── View tab ── */
    const [view, setView] = useState<ViewTab>(isBOD ? "manager" : "personal");

    /* ── Manager view state ── */
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    /* ── Personal view state (moved to component) ── */

    /* ── Lookup maps ── */
    const [departmentName, setDepartmentName] = useState<string>("");
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const userMapCache = useRef<Record<string, { name: string; department: string }>>({});

    /* ── Reject modal ── */
    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");


    /* ─── Fetch helpers ─────────────────────────────── */
    const resolveUserInfo = async (userId: string): Promise<{ name: string; department: string }> => {
        if (!userId) return { name: "Unknown", department: "—" };
        if (userMapCache.current[userId]) return userMapCache.current[userId];
        try {
            const u = await userApi.findById(userId);
            const name = u?.fullName ?? userId.slice(0, 8) + "…";
            const department = u?.departmentName || u?.departmentCode || "—";
            userMapCache.current[userId] = { name, department };
            return { name, department };
        } catch {
            const fallback = { name: userId.slice(0, 8) + "…", department: "—" };
            userMapCache.current[userId] = fallback;
            return fallback;
        }
    };

    const enrichWithNames = async (rows: LeaveRequest[]): Promise<LeaveRequest[]> => {
        // Deduplicate valid userIds only
        const ids = [...new Set(rows.map((r) => r.createdBy).filter(Boolean))];
        await Promise.all(ids.map(resolveUserInfo));
        return rows;
    };

    /* ─── Initial data loads ─────────────────────────── */
    useEffect(() => {
        // Load leave types
        leaveTypeApi.findAll().then(setLeaveTypes).catch(() => { });

        // Load departments if BOD
        if (isBOD) {
            departmentApi.findAll().then(setDepartments).catch(() => { });
        }

        // Load department info via profile
        const storedProfile = localStorage.getItem("profile");
        if (storedProfile) {
            try {
                const p = JSON.parse(storedProfile);
                if (p.departmentName) setDepartmentName(p.departmentName);
            } catch (e) {}
        }
    }, [MANAGER_ID]);

    /* ─── Manager view fetch ─────────────────────────── */
    const fetchManagerRequests = async (p: number) => {
        if (!isBOD && !MANAGER_ID) return;
        setLoading(true);
        setError(null);
        try {
            let result;
            if (isBOD) {
                // If BOD, fetch leaves for BOD approval
                const allData = await leaveApi.getByBod(MANAGER_ID);
                await enrichWithNames(allData);
                setRequests(allData);
                // Fake pagination for client-side list
                setTotalCount(allData.length);
                setTotalPages(Math.ceil(allData.length / PAGE_SIZE));
                setHasMore(p < Math.ceil(allData.length / PAGE_SIZE));
            } else {
                result = await leaveApi.getByManager(MANAGER_ID, p, PAGE_SIZE);
                await enrichWithNames(result.data);
                setRequests(result.data);
                setTotalPages(result.pagination.totalPages);
                setTotalCount(result.pagination.total);
                setHasMore(p < result.pagination.totalPages);
            }
        } catch (err: any) {
            setError(parseBackendError(err, "Failed to load requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === "manager") void fetchManagerRequests(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, page]);


    /* ─── Lookup helpers ─────────────────────────────── */
    const getLeaveTypeName = (leaveTypeCode: string | null) => {
        if (!leaveTypeCode) return "—";
        const lt = leaveTypes.find((l) => l.code === leaveTypeCode);
        return lt?.name ?? leaveTypeCode.slice(0, 8) + "…";
    };

    const getUserName = (userId: string) => {
        if (!userId) return "Unknown";
        return userMapCache.current[userId]?.name ?? userId.slice(0, 8) + "…";
    };

    const getUserDepartment = (userId: string) => {
        if (!userId) return "—";
        return userMapCache.current[userId]?.department ?? "—";
    };

    /* ─── Actions ────────────────────────────────────── */
    const handleApprove = async (req: LeaveRequest) => {
        if (!MANAGER_ID) return;
        setActionLoading(true);
        try {
            await leaveApi.approve(req.id, MANAGER_ID);
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
        } catch (err: any) {
            alert(parseBackendError(err, "Failed to approve"));
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (req: LeaveRequest) => {
        setRejectTarget(req);
        setRejectReason("");
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget || !MANAGER_ID) return;
        setActionLoading(true);
        try {
            await leaveApi.reject(rejectTarget.id, {
                approverId: MANAGER_ID,
                reason: rejectReason || null,
            });
            setRequests((prev) => prev.filter((r) => r.id !== rejectTarget.id));
            setRejectTarget(null);
        } catch (err: any) {
            alert(parseBackendError(err, "Failed to reject"));
        } finally {
            setActionLoading(false);
        }
    };

    /* ─── Filtered data (client-side on current page) ── */
    // For BOD we have the full array, so we slice. For Manager we already have paginated array.
    const searchFiltered = requests.filter((r) => {
        const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
        // The user API sets `departmentName` or `departmentCode`. We match on `departmentName` here since `departmentFilter` is the name or code.
        // Actually `Department` type usually has `name`. Let's assume `getUserDepartment` returns the name.
        const rDept = getUserDepartment(r.createdBy);
        const matchDept = !isBOD || departmentFilter === "ALL" || rDept === departmentFilter;

        const matchSearch =
            search === "" ||
            getUserName(r.createdBy).toLowerCase().includes(search.toLowerCase()) ||
            r.id.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchDept && matchSearch;
    });

    const filtered = isBOD 
        ? searchFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) 
        : searchFiltered;

    const pendingCount = requests.filter((r) => r.status === LeaveRequestStatus.PENDING).length;

    /* ══════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════ */
    return (
        <div className="dh-page">
            {/* ── Header ─────────────────────────────── */}
            <div className="dh-page-header">
                <div>
                    <div className="dh-breadcrumb">
                        <span>Home</span>
                        <span>/</span>
                        <span className="current">Leave Management</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <h1 className="dh-page-title">
                            {view === "manager"
                                ? (isBOD ? "Enterprise Approvals Queue" : `Approval Queue${departmentName ? `: ${departmentName}` : ""}`)
                                : "My Leave Requests"}
                        </h1>
                        {view === "manager" && pendingCount > 0 && (
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: "#FEF3C7",
                                color: "#92400E",
                                fontWeight: 700,
                                fontSize: 13,
                            }}>
                                Pending
                                <span style={{
                                    background: "#F59E0B",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}>{pendingCount}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* ── View toggle + New Request button ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, alignSelf: "flex-end" }}>

                    {/* Toggle */}
                    {!isBOD && (
                    <div style={{
                        display: "flex",
                        background: "var(--dh-gray-100)",
                        borderRadius: 10,
                        padding: 4,
                        gap: 4,
                    }}>
                        <button
                            onClick={() => setView("personal")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 13,
                                transition: "all 0.2s ease",
                                background: view === "personal" ? "white" : "transparent",
                                color: view === "personal" ? "var(--dh-gray-900)" : "var(--dh-gray-500)",
                                boxShadow: view === "personal" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                            }}
                        >
                            Personal View
                        </button>
                        <button
                            onClick={() => setView("manager")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 13,
                                transition: "all 0.2s ease",
                                background: view === "manager" ? "white" : "transparent",
                                color: view === "manager" ? "var(--dh-gray-900)" : "var(--dh-gray-500)",
                                boxShadow: view === "manager" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                            }}
                        >
                            Manager View
                        </button>
                    </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════
                MANAGER VIEW
            ══════════════════════════════════════ */}
            {view === "manager" && (
                <>
                    {/* Filters */}
                    <div className="dh-filter-section">
                        <div className="dh-search-box">
                            <svg className="dh-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                className="dh-search-input"
                                type="text"
                                placeholder="Search by employee name or request ID…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select
                            className="dh-filter-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        {isBOD && (
                            <select
                                className="dh-filter-select"
                                value={departmentFilter}
                                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                                style={{ minWidth: 160 }}
                            >
                                <option value="ALL">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#991B1B", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
                            ⚠ {error}
                        </div>
                    )}

                    {/* Table */}
                    <div className="dh-table-card">
                        <div className="dh-table-wrapper">
                            <table className="dh-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Request ID</th>
                                        <th>Duration</th>
                                        <th>Employee</th>
                                        <th>Department</th>
                                        <th>Leave Type</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9}>
                                                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                                                    <div className="dh-loading-spinner" style={{ width: 32, height: 32 }} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={9}>
                                                <div className="dh-empty-state">
                                                    <div className="dh-empty-icon">📋</div>
                                                    <div className="dh-empty-title">No requests found</div>
                                                    <div className="dh-empty-sub">Adjust your filters to see results</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((req, idx) => {
                                            const name = getUserName(req.createdBy);
                                            return (
                                                <tr key={req.id}>
                                                    <td style={{ color: "var(--dh-gray-500)", fontWeight: 500, width: 48 }}>
                                                        {String((page - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => setSelectedRequest(req)}
                                                            style={{
                                                                border: "none", background: "none", padding: 0, margin: 0,
                                                                textDecoration: "underline", cursor: "pointer",
                                                                fontFamily: "monospace", fontSize: 11,
                                                                color: "var(--dh-primary)", fontWeight: 600, wordBreak: "break-all"
                                                            }}
                                                        >
                                                            {req.id}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                                                            {req.fromDate ? formatDate(req.fromDate) : "—"}
                                                            {req.fromDate && req.toDate && req.fromDate !== req.toDate
                                                                ? ` – ${formatDate(req.toDate)}`
                                                                : ""}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "var(--dh-gray-500)", marginTop: 2 }}>
                                                            {req.totalDays} {req.totalDays === 1 ? "Day" : "Days"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="dh-employee-cell">
                                                            <div className="dh-employee-avatar">
                                                                {getInitials(name)}
                                                            </div>
                                                            <div className="dh-employee-name">{name}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: 13, color: "var(--dh-gray-700)", fontWeight: 500 }}>
                                                            {getUserDepartment(req.createdBy)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="dh-leave-type">
                                                            {getLeaveTypeName(req.leaveTypeCode)}
                                                        </span>
                                                    </td>
                                                    <td style={{ maxWidth: 180, fontSize: 13, color: "var(--dh-gray-600)" }}>
                                                        {req.reason ?? <span style={{ color: "var(--dh-gray-400)" }}>—</span>}
                                                    </td>
                                                    <td>
                                                        <span className={`dh-badge ${req.status.toLowerCase()}`}>
                                                            {STATUS_LABELS[req.status] ?? req.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {req.status === LeaveRequestStatus.PENDING ? (
                                                            <div className="dh-action-cell">
                                                                <button
                                                                    className="dh-btn-approve"
                                                                    disabled={actionLoading}
                                                                    onClick={() => handleApprove(req)}
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    className="dh-btn-reject"
                                                                    disabled={actionLoading}
                                                                    onClick={() => openRejectModal(req)}
                                                                >
                                                                    ✕ Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: 13, color: "var(--dh-gray-400)" }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="dh-pagination">
                            <div className="dh-pagination-info">
                                {loading ? "Loading…" : `Showing ${totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} results`}
                            </div>
                            <div className="dh-pagination-controls">
                                <button className="dh-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                                <button className="dh-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => Math.abs(p - page) <= 2)
                                    .map((p) => (
                                        <button
                                            key={p}
                                            className={`dh-page-btn ${p === page ? "active" : ""}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                <button className="dh-page-btn" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>›</button>
                                <button className="dh-page-btn" onClick={() => setPage(totalPages)} disabled={!hasMore}>»</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════
                PERSONAL VIEW
            ══════════════════════════════════════ */}
            {view === "personal" && <PersonalLeaveView userId={MANAGER_ID} />}

            {/* ── Reject Modal ───────────────────────── */}
            {rejectTarget && (
                <div className="dh-modal-overlay" onClick={() => setRejectTarget(null)}>
                    <div className="dh-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dh-modal-title">Reject Leave Request</div>
                        <p style={{ fontSize: 14, color: "var(--dh-gray-600)", marginBottom: 16 }}>
                            Rejecting request{" "}
                            <strong>REQ-{rejectTarget.id.slice(0, 8).toUpperCase()}</strong>{" "}
                            from <strong>{getUserName(rejectTarget.createdBy)}</strong>.
                        </p>
                        <label className="dh-modal-label">Reason (optional)</label>
                        <textarea
                            className="dh-modal-textarea"
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="dh-modal-actions">
                            <button className="dh-modal-cancel-btn" onClick={() => setRejectTarget(null)}>
                                Cancel
                            </button>
                            <button
                                className="dh-modal-confirm-btn"
                                onClick={handleRejectConfirm}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Rejecting…" : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Request Details Modal ───────────── */}
            {selectedRequest && (
                <LeaveRequestDetailsModal
                    request={selectedRequest}
                    leaveTypeName={getLeaveTypeName(selectedRequest.leaveTypeCode)}
                    onClose={() => setSelectedRequest(null)}
                />
            )}
        </div>
    );
}
