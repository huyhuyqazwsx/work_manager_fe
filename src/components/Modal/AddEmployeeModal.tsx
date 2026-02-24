import { useState } from "react";
import "./AddEmployeeModal.css";
import { inviteApi } from "../../features/invite/api/inviteApi";
import type { InviteForm } from "../../types/invite.type";

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddEmployeeModal({
                                             isOpen,
                                             onClose,
                                             onSuccess,
                                         }: AddEmployeeModalProps) {
    const [formData, setFormData] = useState<InviteForm>({
        email: "",
        role: "EMPLOYEE",
        hireDate: "",
        departmentCode: "",
    });

    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await inviteApi.createInvite(formData);
            alert("Invitation sent successfully!");
            onSuccess();
            handleClose();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create invite");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            email: "",
            role: "EMPLOYEE",
            hireDate: "",
            departmentCode: "",
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content large"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="modal-header vertical">
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span>Employee Management</span>
                        <span className="separator">/</span>
                        <span className="current">Add New</span>
                    </div>

                    <h2>Add New Employee Profile</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">

                        <div className="form-card">
                            <div className="section-header">
                                <h3>General Information</h3>
                            </div>

                            <div className="form-grid">

                                {/* EMAIL */}
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        placeholder="employee@skysolution.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                {/* ROLE */}
                                <div className="form-group">
                                    <label>System Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                role: e.target.value as InviteForm["role"],
                                            })
                                        }
                                        required
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="DEPARTMENT_HEAD">
                                            Department Head
                                        </option>
                                        <option value="HR">HR</option>
                                        <option value="BOD">BOD</option>
                                    </select>
                                </div>

                                {/* HIRE DATE */}
                                <div className="form-group">
                                    <label>Hire Date *</label>
                                    <input
                                        type="date"
                                        value={formData.hireDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                hireDate: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                {/* DEPARTMENT */}
                                <div className="form-group">
                                    <label>Department</label>
                                    <select
                                        value={formData.departmentCode}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                departmentCode: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="">Select Department</option>
                                        <option value="TTPTCN">TTPTCN</option>
                                        <option value="HCNS">HCNS</option>
                                        <option value="Marketing">Marketing</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Sending Invitation..."
                                : "Send Invitation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}