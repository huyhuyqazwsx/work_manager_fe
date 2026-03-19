import { useEffect, useState } from "react";
import { userApi } from "../../../features/user/api/userApi";
import { departmentApi } from "../../../features/department/api/departmentApi";
import type { UserResponse } from "../../../types/user.types";
import type { Department } from "../../../types/department.types";
import { UserRole, UserStatus } from "../../../types/enum/enum";
import { toast } from "../../../components/toast/toast";
import { parseBackendError } from "../../../utils/error.utils";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
    EMPLOYEE: "Employee",
    DEPARTMENT_HEAD: "Dept Head",
    HR: "HR",
    BOD: "BOD",
};

const roleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string }> = {
        BOD:             { bg: "#FEF3C7", color: "#92400E" },
        HR:              { bg: "#EFF6FF", color: "#1D4ED8" },
        DEPARTMENT_HEAD: { bg: "#F0FDF4", color: "#166534" },
        EMPLOYEE:        { bg: "#F1F5F9", color: "#475569" },
    };
    const s = map[role] ?? { bg: "#F1F5F9", color: "#475569" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {ROLE_LABELS[role] ?? role}
        </span>
    );
};

const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        ACTIVE:   { bg: "#F0FDF4", color: "#166534", label: "Active" },
        INACTIVE: { bg: "#FEF2F2", color: "#991B1B", label: "Inactive" },
        PENDING:  { bg: "#FFFBEB", color: "#92400E", label: "Pending" },
        NONE:     { bg: "#F1F5F9", color: "#475569", label: "None" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#475569", label: status };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {s.label}
        </span>
    );
};

interface ConfirmTarget {
    userId: string;
    user: UserResponse;
    newRole: UserRole;
}

function buildConfirmMessage(user: UserResponse, newRole: UserRole, deptMap: Record<string, string>): string {
    const name = user.fullName ?? user.code ?? "This user";
    const deptName = deptMap[user.departmentCode] ?? user.departmentCode ?? "their department";
    switch (newRole) {
        case UserRole.DEPARTMENT_HEAD:
            return `${name} will become Department Head and be assigned as manager of "${deptName}".`;
        case UserRole.HR:
            return `${name} will be assigned as HR Manager of the Human Resources Department.`;
        case UserRole.EMPLOYEE:
            return `${name} will be set as Employee. If they currently manage a department, they will be removed as manager.`;
        case UserRole.BOD:
            return `${name} will be granted BOD privileges with full system access.`;
        default:
            return `Are you sure you want to change ${name}'s role to ${newRole}?`;
    }
}

export default function RoleManagementPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [deptMap, setDeptMap] = useState<Record<string, string>>({}); // code → name
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<UserRole>(UserRole.EMPLOYEE);
    const [saving, setSaving] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

    useEffect(() => {
        Promise.all([userApi.findAll(), departmentApi.findAll()])
            .then(([usersRes, deptsRes]) => {
                setUsers(usersRes);
                setDepartments(deptsRes);
                const map: Record<string, string> = {};
                deptsRes.forEach(d => { map[d.code] = d.name; });
                setDeptMap(map);
            })
            .catch(() => toast.error("Tải dữ liệu thất bại."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (u.fullName ?? "").toLowerCase().includes(q) ||
            (u.code ?? "").toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q);
        const matchRole   = !filterRole   || u.role === filterRole;
        const matchDept   = !filterDept   || u.departmentCode === filterDept;
        const matchStatus = !filterStatus || u.status === filterStatus;
        return matchSearch && matchRole && matchDept && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const resetPage = () => setPage(1);

    const handleEditStart = (u: UserResponse) => {
        setEditingId(u.id);
        setEditRole(u.role as UserRole);
    };

    const handleRequestSave = (user: UserResponse) => {
        setConfirmTarget({ userId: user.id, user, newRole: editRole });
    };

    const handleConfirmSave = async () => {
        if (!confirmTarget) return;
        setSaving(true);
        try {
            await userApi.changeRole(confirmTarget.userId, confirmTarget.newRole);
            setUsers(prev => prev.map(u => u.id === confirmTarget.userId ? { ...u, role: confirmTarget.newRole } : u));
            toast.success("Đổi role thành công.");
            setEditingId(null);
            setConfirmTarget(null);
        } catch (err: any) {
            toast.error(parseBackendError(err, "Đổi role thất bại."));
        } finally {
            setSaving(false);
        }
    };

    const thStyle: React.CSSProperties = {
        padding: "11px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        color: "#94A3B8", background: "#F8FAFC", whiteSpace: "nowrap", letterSpacing: "0.05em",
    };
    const tdStyle: React.CSSProperties = {
        padding: "13px 14px", fontSize: 13, color: "#0F172A",
        borderBottom: "1px solid #F1F5F9", verticalAlign: "middle",
    };

    return (
        <div style={{ padding: "24px 32px" }}>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>Home / Roles</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Role Management</h2>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); resetPage(); }}
                    placeholder="Search name, code, email..."
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, width: 240, outline: "none" }}
                />
                <select value={filterDept} onChange={e => { setFilterDept(e.target.value); resetPage(); }}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white" }}>
                    <option value="">All Departments</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.code}>{d.name}</option>
                    ))}
                </select>
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); resetPage(); }}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white" }}>
                    <option value="">All Roles</option>
                    {Object.values(UserRole).map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                    ))}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); resetPage(); }}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "white" }}>
                    <option value="">All Status</option>
                    {Object.values(UserStatus).filter(s => s !== UserStatus.NONE).map(s => (
                        <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                    ))}
                </select>
                {(search || filterRole || filterDept || filterStatus) && (
                    <button onClick={() => { setSearch(""); setFilterRole(""); setFilterDept(""); setFilterStatus(""); resetPage(); }}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: "pointer", color: "#64748B" }}>
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                            <th style={{ ...thStyle, textAlign: "center", width: 48 }}>NO</th>
                            <th style={{ ...thStyle, width: 90 }}>CODE</th>
                            <th style={thStyle}>EMAIL</th>
                            <th style={thStyle}>NAME</th>
                            <th style={thStyle}>DEPARTMENT</th>
                            <th style={thStyle}>STATUS</th>
                            <th style={thStyle}>ROLE</th>
                            <th style={{ ...thStyle, textAlign: "center", width: 100 }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "#94A3B8" }}>Loading...</td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "#94A3B8" }}>No users found.</td></tr>
                        ) : paginated.map((u, idx) => (
                            <tr key={u.id} style={{ background: editingId === u.id ? "#F8FAFC" : "white" }}>
                                <td style={{ ...tdStyle, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                                    {String((page - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 600, color: "#64748B", fontSize: 12 }}>
                                    {u.code ?? "—"}
                                </td>
                                <td style={{ ...tdStyle, color: "#475569" }}>{u.email ?? "—"}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#64748B", flexShrink: 0 }}>
                                            {(u.fullName ?? "?").charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{u.fullName ?? "—"}</span>
                                    </div>
                                </td>
                                <td style={{ ...tdStyle, color: "#475569" }}>
                                    {deptMap[u.departmentCode] ?? u.departmentCode ?? "—"}
                                </td>
                                <td style={tdStyle}>{statusBadge(u.status)}</td>
                                <td style={tdStyle}>
                                    {editingId === u.id ? (
                                        <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                                            style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #3B82F6", fontSize: 13, outline: "none" }}>
                                            {Object.values(UserRole).map(r => (
                                                <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                                            ))}
                                        </select>
                                    ) : roleBadge(u.role)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {editingId === u.id ? (
                                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                            <button
                                                onClick={() => handleRequestSave(u)}
                                                style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#1E3A8A", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748B" }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditStart(u)}
                                            title="Edit role"
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", padding: 4, borderRadius: 6 }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Confirm Role Change Modal */}
            {confirmTarget && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: 16, padding: "28px 28px 24px", width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Confirm Update</div>
                                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>
                                    {buildConfirmMessage(confirmTarget.user, confirmTarget.newRole, deptMap)}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                            <button
                                onClick={() => setConfirmTarget(null)}
                                disabled={saving}
                                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748B" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                disabled={saving}
                                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                            >
                                {saving ? "Saving..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <div style={{ fontSize: 13, color: "#94A3B8" }}>
                    Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#CBD5E1" : "#0F172A" }}
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", borderColor: p === page ? "#1E3A8A" : "#E2E8F0", background: p === page ? "#1E3A8A" : "white", color: p === page ? "white" : "#0F172A", fontWeight: p === page ? 700 : 400 }}>
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#CBD5E1" : "#0F172A" }}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}
