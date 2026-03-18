import React, { useEffect, useRef, useState } from "react";
import { userApi } from "../../features/user/api/userApi";
import { useDepartments } from "../../features/department/hooks/useDepartmentQuery";
import { parseBackendError } from "../../utils/error.utils";

import "./employee-directory.css";

import ImportModal from "../../components/Modal/ImportModal";
import AddEmployeeModal from "../../components/Modal/AddEmployeeModal";

import type { UserResponse } from "../../types/user.types";
import { ContractType, UserRole, UserStatus } from "../../types/enum/enum";

const PAGE_SIZE = 10;

type EditDraft = {
    fullName: string;
    email: string;
    departmentId: string;   // sent to BE
    status: UserStatus;
    contractType: ContractType;
    joinDate: string;
    contractSignedDate: string;
};

export default function EmployeeDirectory() {
    const [employees, setEmployees] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [openDetailId, setOpenDetailId] = useState<string | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    // Departments list for dropdown
    const { departments } = useDepartments();

    // Inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingSaveEmp, setPendingSaveEmp] = useState<UserResponse | null>(null);

    const fetchEmployees = async () => {
        try {
            const data = await userApi.findAll();
            setEmployees(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchEmployees();
    }, []);

    // Close detail popup when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setOpenDetailId(null);
            }
        };
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, []);

    const roleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.HR: return "pink";
            case UserRole.DEPARTMENT_HEAD: return "purple";
            case UserRole.BOD: return "orange";
            default: return "blue";
        }
    };

    const statusColor = (status: UserStatus) => {
        switch (status) {
            case UserStatus.ACTIVE: return "active";
            case UserStatus.PENDING: return "pending";
            case UserStatus.INACTIVE: return "inactive";
            default: return "inactive";
        }
    };

    const startEdit = (emp: UserResponse) => {
        setEditingId(emp.id);
        setSaveError(null);
        setOpenDetailId(null);
        // Try to find matching dept id from code; fall back to empty string
        const matchedDept = departments.find(d => d.code === emp.departmentCode);
        setEditDraft({
            fullName: emp.fullName ?? "",
            email: emp.email ?? "",
            departmentId: matchedDept?.id ?? "",
            status: emp.status,
            contractType: emp.contractType,
            joinDate: emp.joinDate ? emp.joinDate.slice(0, 10) : "",
            contractSignedDate: emp.contractSignedDate ? emp.contractSignedDate.slice(0, 10) : "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDraft(null);
        setSaveError(null);
    };

    const saveEdit = async (emp: UserResponse) => {
        if (!editDraft) return;
        setSaving(true);
        setSaveError(null);
        try {
            await userApi.update(emp.id, {
                fullName: editDraft.fullName || undefined,
                email: editDraft.email || undefined,
                departmentId: editDraft.departmentId || undefined,
                status: editDraft.status,
                contractType: editDraft.contractType,
                joinDate: editDraft.joinDate
                    ? new Date(editDraft.joinDate).toISOString()
                    : undefined,
                contractSignedDate: editDraft.contractSignedDate
                    ? new Date(editDraft.contractSignedDate).toISOString()
                    : undefined,
            });
            // Resolve dept code from id for optimistic update
            const chosenDept = departments.find(d => d.id === editDraft.departmentId);
            // Optimistically update local state
            setEmployees(prev =>
                prev.map(e =>
                    e.id === emp.id
                        ? {
                            ...e,
                            fullName: editDraft.fullName,
                            email: editDraft.email,
                            departmentCode: chosenDept?.code ?? e.departmentCode,
                            status: editDraft.status,
                            contractType: editDraft.contractType,
                            joinDate: editDraft.joinDate,
                            contractSignedDate: editDraft.contractSignedDate || null,
                        }
                        : e
                )
            );
            setEditingId(null);
            setEditDraft(null);
        } catch (err: any) {
            setSaveError(parseBackendError(err, "Save failed. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    const field = <K extends keyof EditDraft>(key: K, value: string) =>
        setEditDraft(prev => prev ? { ...prev, [key]: value } : prev);

    // FILTER LOGIC
    const filteredEmployees = React.useMemo(() => {
        let list = employees;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(e =>
                (e.fullName && e.fullName.toLowerCase().includes(q)) ||
                (e.email && e.email.toLowerCase().includes(q)) ||
                (e.code && e.code.toLowerCase().includes(q))
            );
        }

        if (filterDepartment) {
            // Check by id or code depending on what the filter uses
            // The department filter dropdown will use code since the employee data has departmentCode
            list = list.filter(e => e.departmentCode === filterDepartment);
        }

        if (filterStatus) {
            list = list.filter(e => e.status === filterStatus);
        }

        return list;
    }, [employees, searchQuery, filterDepartment, filterStatus]);

    // RESET PAGE ON FILTER CHANGE
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filterDepartment, filterStatus]);

    const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    const paginatedEmployees = filteredEmployees.slice((validPage - 1) * PAGE_SIZE, validPage * PAGE_SIZE);

    const handleImportSuccess = () => void fetchEmployees();
    const handleAddSuccess = () => void fetchEmployees();

    return (
        <div className="employee-directory">
            {/* HEADER */}
            <div className="page-header">
                <h1 className="page-title">Employee Directory</h1>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={() => setIsImportOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Import File
                    </button>
                    <button className="primary-btn" onClick={() => setIsAddOpen(true)}>
                        + Add New Employee
                    </button>
                </div>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="filter-toolbar">
                <div className="filter-search">
                    <svg className="filter-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        type="text"
                        placeholder="Search by Name, ID, or Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-select-wrap">
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.code}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-select-wrap">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Status</option>
                        <option value={UserStatus.ACTIVE}>Active</option>
                        <option value={UserStatus.PENDING}>Pending</option>
                        <option value={UserStatus.INACTIVE}>Inactive</option>
                    </select>
                </div>

                <button
                    className="filter-clear-btn"
                    onClick={() => {
                        setSearchQuery("");
                        setFilterDepartment("");
                        setFilterStatus("");
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Clear
                </button>
            </div>

            <div className="table-card">
                {loading ? (
                    <div className="loading-box">Loading employees...</div>
                ) : (
                    <>
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>CODE</th>
                                    <th>EMPLOYEE</th>
                                    <th>EMAIL</th>
                                    <th>DEPARTMENT</th>
                                    <th>ROLE</th>
                                    <th>STATUS</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedEmployees.map((emp) => {
                                    const isEditing = editingId === emp.id;

                                    return (
                                        <tr key={emp.id} className={isEditing ? "row-editing" : ""}>
                                            {/* CODE */}
                                            <td>{emp.code ?? "—"}</td>

                                            {/* EMPLOYEE NAME */}
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        className="inline-input"
                                                        value={editDraft!.fullName}
                                                        onChange={e => field("fullName", e.target.value)}
                                                        placeholder="Full name"
                                                    />
                                                ) : (
                                                    <div className="employee-cell">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`}
                                                            className="employee-avatar"
                                                            alt="avatar"
                                                        />
                                                        <span className="employee-name">{emp.fullName || "—"}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* EMAIL */}
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        className="inline-input"
                                                        type="email"
                                                        value={editDraft!.email}
                                                        onChange={e => field("email", e.target.value)}
                                                        placeholder="Email"
                                                    />
                                                ) : (
                                                    emp.email
                                                )}
                                            </td>

                                            {/* DEPARTMENT */}
                                            <td>
                                                {isEditing ? (
                                                    <select
                                                        className="inline-select"
                                                        value={editDraft!.departmentId}
                                                        onChange={e => field("departmentId", e.target.value)}
                                                    >
                                                        <option value="">— Chọn phòng —</option>
                                                        {departments.map(dept => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    emp.departmentCode
                                                )}
                                            </td>

                                            {/* ROLE — always read-only */}
                                            <td>
                                                <span className={`role-badge ${roleColor(emp.role)}`}>
                                                    {emp.role.replace(/_/g, " ")}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td>
                                                {isEditing ? (
                                                    <select
                                                        className="inline-select"
                                                        value={editDraft!.status}
                                                        onChange={e => field("status", e.target.value as UserStatus)}
                                                    >
                                                        {Object.values(UserStatus).filter(s => s !== UserStatus.NONE).map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`status ${statusColor(emp.status)}`}>
                                                        {emp.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACTION */}
                                            <td className="action-cell">
                                                {isEditing ? (
                                                    <div className="edit-actions">
                                                        {/* Extra editable fields shown inline below the row are in a subrow;
                                                            contract/dates are in the action cell as a mini form */}
                                                        <button
                                                            className="save-btn"
                                                            onClick={() => {
                                                                setPendingSaveEmp(emp);
                                                                setShowConfirm(true);
                                                            }}
                                                            disabled={saving}
                                                            title="Save"
                                                        >
                                                            {saving ? (
                                                                <span className="spinner" />
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={cancelEdit}
                                                            disabled={saving}
                                                            title="Cancel"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="row-action-btns">
                                                        {/* Edit button */}
                                                        <button
                                                            className="edit-btn"
                                                            onClick={() => startEdit(emp)}
                                                            title="Edit employee"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>

                                                        {/* Eye / detail button */}
                                                        <button
                                                            className={`view-btn ${openDetailId === emp.id ? "view-btn--active" : ""}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDetailId(openDetailId === emp.id ? null : emp.id);
                                                            }}
                                                            title="View details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </button>

                                                        {/* Detail popup */}
                                                        {openDetailId === emp.id && (
                                                            <div ref={popupRef} className="employee-detail-popup">
                                                                <div className="popup-contract-badge">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <polyline points="12 6 12 12 16 14" />
                                                                    </svg>
                                                                    <span>{emp.contractType.replace(/_/g, " ")}</span>
                                                                </div>
                                                                <div className="popup-dates-row">
                                                                    <div className="popup-date-col">
                                                                        <div className="popup-date-col-label">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                                            </svg>
                                                                            Joining Date
                                                                        </div>
                                                                        <span className="popup-date-col-value">
                                                                            {emp.joinDate
                                                                                ? new Date(emp.joinDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                                                                                : "—"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="popup-date-col-divider" />
                                                                    <div className="popup-date-col">
                                                                        <div className="popup-date-col-label">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                                            </svg>
                                                                            Signed Date
                                                                        </div>
                                                                        <span className="popup-date-col-value">
                                                                            {emp.contractSignedDate
                                                                                ? new Date(emp.contractSignedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                                                                                : "—"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Inline edit extra fields (contract type + dates) shown as a sub-row */}
                        {editingId && editDraft && (() => {
                            const idx = paginatedEmployees.findIndex(e => e.id === editingId);
                            if (idx === -1) return null;
                            return (
                                <div className="edit-subrow">
                                    {saveError && (
                                        <div className="edit-error">⚠ {saveError}</div>
                                    )}
                                    <div className="edit-subrow-fields">
                                        <label className="edit-subrow-label">
                                            CONTRACT TYPE
                                            <select
                                                className="edit-subrow-input"
                                                value={editDraft.contractType}
                                                onChange={e => field("contractType", e.target.value as ContractType)}
                                            >
                                                {Object.values(ContractType).map(c => (
                                                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="edit-subrow-label">
                                            JOINING DATE
                                            <input
                                                type="date"
                                                className="edit-subrow-input"
                                                value={editDraft.joinDate}
                                                onChange={e => {
                                                    const newJoinDate = e.target.value;
                                                    setEditDraft(prev => {
                                                        if (!prev) return prev;
                                                        let newSignedDate = prev.contractSignedDate;
                                                        if (newSignedDate && new Date(newJoinDate) > new Date(newSignedDate)) {
                                                            newSignedDate = newJoinDate;
                                                        }
                                                        return { ...prev, joinDate: newJoinDate, contractSignedDate: newSignedDate };
                                                    });
                                                }}
                                            />
                                        </label>
                                        <label className="edit-subrow-label">
                                            SIGNED DATE
                                            <input
                                                type="date"
                                                className="edit-subrow-input"
                                                min={editDraft.joinDate}
                                                value={editDraft.contractSignedDate}
                                                onChange={e => {
                                                    const newSignedDate = e.target.value;
                                                    setEditDraft(prev => {
                                                        if (!prev) return prev;
                                                        if (prev.joinDate && new Date(newSignedDate) < new Date(prev.joinDate)) {
                                                            return prev;
                                                        }
                                                        return { ...prev, contractSignedDate: newSignedDate };
                                                    });
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* PAGINATION */}
                        <div className="pagination">
                            <div className="pagination-info">
                                Showing {(validPage - 1) * PAGE_SIZE + 1}–{Math.min(validPage * PAGE_SIZE, filteredEmployees.length)} of {filteredEmployees.length} results
                            </div>
                            <div className="pagination-controls">
                                <button className="pagination-btn" disabled={validPage === 1} onClick={() => setPage(validPage - 1)}>Prev</button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`pagination-btn ${validPage === i + 1 ? "active" : ""}`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="pagination-btn" disabled={validPage === totalPages || totalPages === 0} onClick={() => setPage(validPage + 1)}>Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODALS */}
            <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onSuccess={handleImportSuccess} />
            <AddEmployeeModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={handleAddSuccess} />

            {/* CONFIRM UPDATE DIALOG */}
            {showConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog">
                        <div className="confirm-icon-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div className="confirm-body">
                            <h3 className="confirm-title">Confirm Update</h3>
                            <p className="confirm-message">Are you sure you want to save the change?</p>
                            <div className="confirm-actions">
                                <button
                                    className="confirm-btn-cancel"
                                    onClick={() => { setShowConfirm(false); setPendingSaveEmp(null); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="confirm-btn-ok"
                                    disabled={saving}
                                    onClick={async () => {
                                        if (pendingSaveEmp) {
                                            setShowConfirm(false);
                                            await saveEdit(pendingSaveEmp);
                                            setPendingSaveEmp(null);
                                        }
                                    }}
                                >
                                    {saving ? <span className="spinner" /> : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}