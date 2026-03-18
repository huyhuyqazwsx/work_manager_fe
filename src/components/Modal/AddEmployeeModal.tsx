import { parseBackendError } from "../../utils/error.utils";
import { useEffect, useState } from "react";
import "./AddEmployeeModal.css";
import { inviteApi } from "../../features/invite/api/inviteApi";
import { userApi } from "../../features/user/api/userApi";
import { useDepartments } from "../../features/department/hooks/useDepartmentQuery";
import type { InviteForm } from "../../types/invite.type";
import { ContractType, UserRole } from "../../types/enum/enum";

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const formatDateToDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return "dd/mm/yyyy";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
};

export default function AddEmployeeModal({
    isOpen,
    onClose,
    onSuccess,
}: AddEmployeeModalProps) {
    const { departments } = useDepartments();

    const [formData, setFormData] = useState<Partial<InviteForm>>({
        email: "",
        department: "",
        position: "",
        contractType: ContractType.OFFICIAL_EMPLOYEE,
        joinDate: "",
        contractSignedDate: "",
        role: UserRole.EMPLOYEE,
    });

    const [employeeCode, setEmployeeCode] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMessage(null);
            // Fetch dynamically generated code from backend
            userApi.getCountCode().then((res: any) => {
                // Adjust this if response shape is different (res.count or res directly)
                setEmployeeCode(typeof res === 'object' ? res.code || res.count || "" : String(res));
            }).catch(console.error);

            // Reset form
            setFormData({
                email: "",
                department: "",
                position: "",
                contractType: ContractType.OFFICIAL_EMPLOYEE,
                joinDate: "",
                contractSignedDate: "",
                role: UserRole.EMPLOYEE,
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        setMessage(null);
        try {
            const payload: InviteForm = {
                employeeCode: employeeCode || undefined,
                email: formData.email!,
                department: formData.department!, // assuming backend takes ID or code here depending on logic, will send ID
                position: formData.position || undefined,
                contractType: formData.contractType!,
                joinDate: new Date(formData.joinDate!).toISOString(),
                contractSignedDate: formData.contractSignedDate
                    ? new Date(formData.contractSignedDate).toISOString()
                    : undefined,
                role: formData.role!,
            };

            await inviteApi.createInvite(payload);
            setMessage({ type: "success", text: "Employee added and invitation sent successfully!" });
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1200);
        } catch (error: any) {
            setMessage({ type: "error", text: parseBackendError(error, "Failed to create invite.") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content large add-emp-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="modal-header">
                    <h2>Add New Employee Profile</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body-scroll">
                        {/* CUSTOM ALERT MESSAGE */}
                        {message && (
                            <div className={`alert-box ${message.type}`}>
                                {message.type === 'success' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* GENERAL INFORMATION SECTION */}
                        <div className="form-card">
                            <div className="section-header-row">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <h3>General Information</h3>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Employee ID</label>
                                    <div className="input-with-icon disabled-wrap">
                                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <input type="text" value={employeeCode} disabled />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Company Email <span className="req">*</span></label>
                                    <div className="input-with-icon">
                                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <input
                                            type="email"
                                            placeholder="anguyenvan@skycorp.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ORGANIZATION & ROLE SECTION */}
                        <div className="form-card">
                            <div className="section-header-row">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                <h3>Organization & Role</h3>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Department <span className="req">*</span></label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.name}>{d.code} - {d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Job Position <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Backend Developer"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Joining Date <span className="req">*</span></label>
                                    <div className="custom-date-picker">
                                        <span className={`date-display ${formData.joinDate ? 'has-val' : ''}`}>
                                            {formatDateToDDMMYYYY(formData.joinDate)}
                                        </span>
                                        <svg className="date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <input
                                            type="date"
                                            value={formData.joinDate}
                                            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                            required
                                            className="date-input-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Contract Signed Date</label>
                                    <div className="custom-date-picker">
                                        <span className={`date-display ${formData.contractSignedDate ? 'has-val' : ''}`}>
                                            {formatDateToDDMMYYYY(formData.contractSignedDate)}
                                        </span>
                                        <svg className="date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <input
                                            type="date"
                                            value={formData.contractSignedDate}
                                            onChange={(e) => setFormData({ ...formData, contractSignedDate: e.target.value })}
                                            className="date-input-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Contract Type <span className="req">*</span></label>
                                    <select
                                        value={formData.contractType}
                                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                                        required
                                    >
                                        {Object.values(ContractType).map(c => (
                                            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Role <span className="req">*</span></label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                        required
                                    >
                                        {Object.values(UserRole).map(r => (
                                            <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer bottom-right">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}