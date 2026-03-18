import { useState, useEffect } from "react";
import SelectEmployeesModal from "./SelectEmployeesModal";
import DateRangeTimePicker from "./DateRangeTimePicker";
import { otPlanApi } from "../../features/ot-plan/api/otPlanApi";
import { userApi } from "../../features/user/api/userApi";
import type { CreateOTPlanDto } from "../../types/ot.types";
import { parseBackendError } from "../../utils/error.utils";

interface Employee {
    code: string;
    name: string;
}

interface CreateOTPlanViewProps {
    userId: string;
    onCancel: () => void;
    onSubmitSuccess: () => void;
}

export default function CreateOTPlanView({ userId, onCancel, onSubmitSuccess }: CreateOTPlanViewProps) {
    const [reason, setReason] = useState("");
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!userId) return;
        userApi.getUsersByUserOfDepartment(userId)
            .then(users => {
                setAllEmployees(users.map(u => ({
                    code: u.code ?? u.id,
                    name: u.fullName,
                })));
            })
            .catch(console.error)
            .finally(() => setLoadingEmployees(false));
    }, [userId]);

    const handleAddEmployees = (employees: Employee[]) => {
        setSelectedEmployees(prev => [...prev, ...employees.map(e => ({
            ...e,
            startDate: "",
            endDate: "",
            startTime: "18:00",
            endTime: "21:00",
            estHours: 0,
        }))]);
        setShowEmployeeModal(false);
    };

    const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const handleRemoveEmployee = (idx: number) => {
        setSelectedEmployees(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async (isSubmit: boolean) => {
        setErrorMsg("");
        if (!reason.trim()) { setErrorMsg("Please enter reason / content."); return; }
        if (selectedEmployees.length === 0) { setErrorMsg("Please add at least one employee."); return; }

        try {
            setSubmitting(true);
            const profile = JSON.parse(localStorage.getItem("profile") || "{}");
            const departmentId = profile.departmentId || "";

            const dto: CreateOTPlanDto = {
                departmentId,
                managerId: userId,
                reason,
                tickets: selectedEmployees.map(e => ({
                    employeeCode: e.code,
                    startDate: e.startDate || new Date().toISOString().split("T")[0],
                    endDate: e.endDate || new Date().toISOString().split("T")[0],
                    startTime: e.startTime,
                    endTime: e.endTime
                }))
            };

            const newPlan = await otPlanApi.createPlan(dto);

            if (isSubmit) {
                await otPlanApi.submitPlan(newPlan.id, userId);
            }

            onSubmitSuccess();
        } catch (err: any) {
            console.error(err);
            setErrorMsg(parseBackendError(err, `Failed to ${isSubmit ? "submit" : "save"} plan`));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>Create New OT Plan</h2>
                <button 
                    onClick={() => handleSave(false)}
                    disabled={submitting}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "#475569", color: "white", fontWeight: 600, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}
                >
                    <span>💾</span> {submitting ? "Saving..." : "Save as Draft"}
                </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
                <div style={{
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
                    padding: "12px 16px", marginBottom: 16,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                    <span style={{ color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>⚠ {errorMsg}</span>
                    <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C1C", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* General Info */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dh-gray-500)", marginBottom: 16, marginTop: 0 }}>
                    General Information
                </h3>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--dh-gray-700)", marginBottom: 8 }}>
                        Reason / Content <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Deployment Server & Fix Critical Bug"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, boxSizing: "border-box" }}
                    />
                </div>
            </div>

            {/* Resource Allocation */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", padding: "24px 0" }}>
                <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dh-gray-500)", margin: 0 }}>
                        Resource Allocation
                    </h3>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => setSelectedEmployees([])} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", color: "var(--dh-gray-700)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>🗑</span> Clear All
                        </button>
                        <button onClick={() => setShowEmployeeModal(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            + Add Employee
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--dh-gray-50)", borderTop: "1px solid var(--dh-gray-200)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", width: 60 }}>No.</th>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", minWidth: 200 }}>Employee</th>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", minWidth: 220 }}>Date Range</th>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", minWidth: 180 }}>Time Range</th>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", textAlign: "center" }}>Est. Hours / Day</th>
                                <th style={{ padding: "12px 24px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", textAlign: "center", width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--dh-gray-400)" }}>
                                        No employees selected yet. Click "Add Employee" to allocate resources.
                                    </td>
                                </tr>
                            ) : (
                                selectedEmployees.map((emp, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                        <td style={{ padding: "16px 24px", color: "var(--dh-gray-500)", fontSize: 13 }}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#64748B", fontSize: 12 }}>
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>{emp.name}</div>
                                                    <div style={{ fontSize: 12, color: "var(--dh-gray-500)" }}>{emp.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Date Range */}
                                        <td style={{ padding: "12px 24px" }}>
                                            <DateRangeTimePicker
                                                value={{
                                                    startDate: emp.startDate,
                                                    endDate: emp.endDate,
                                                    startTime: emp.startTime,
                                                    endTime: emp.endTime,
                                                }}
                                                onChange={v => {
                                                    const diff = (toMin(v.endTime) - toMin(v.startTime)) / 60;
                                                    setSelectedEmployees(prev => prev.map((e, i) =>
                                                        i !== idx ? e : {
                                                            ...e,
                                                            startDate: v.startDate,
                                                            endDate: v.endDate,
                                                            startTime: v.startTime,
                                                            endTime: v.endTime,
                                                            estHours: diff > 0 ? diff : 0,
                                                        }
                                                    ));
                                                }}
                                            />
                                        </td>

                                        {/* Time Range */}
                                        <td style={{ padding: "12px 24px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <input
                                                    type="time"
                                                    value={emp.startTime}
                                                    onChange={e => {
                                                        const newStart = e.target.value;
                                                        const diff = (toMin(emp.endTime) - toMin(newStart)) / 60;
                                                        setSelectedEmployees(prev => prev.map((en, i) =>
                                                            i !== idx ? en : { ...en, startTime: newStart, estHours: diff > 0 ? diff : 0 }
                                                        ));
                                                    }}
                                                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13, outline: "none", width: 90 }}
                                                />
                                                <span style={{ color: "var(--dh-gray-400)", fontSize: 12 }}>–</span>
                                                <input
                                                    type="time"
                                                    value={emp.endTime}
                                                    onChange={e => {
                                                        const newEnd = e.target.value;
                                                        const diff = (toMin(newEnd) - toMin(emp.startTime)) / 60;
                                                        setSelectedEmployees(prev => prev.map((en, i) =>
                                                            i !== idx ? en : { ...en, endTime: newEnd, estHours: diff > 0 ? diff : 0 }
                                                        ));
                                                    }}
                                                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", fontSize: 13, outline: "none", width: 90 }}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: 600, color: "var(--dh-gray-900)", fontSize: 13 }}>
                                            {emp.estHours.toFixed(1)}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                            <button onClick={() => handleRemoveEmployee(idx)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--dh-gray-400)", fontSize: 16 }}>
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", color: "var(--dh-gray-700)", fontWeight: 600, fontSize: 14, cursor: "pointer" }} disabled={submitting}>
                    Cancel
                </button>
                <button onClick={() => handleSave(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)" }} disabled={submitting}>
                    {submitting ? "Processing..." : "Submit Plan →"}
                </button>
            </div>

            {/* Modals */}
            {showEmployeeModal && (
                <SelectEmployeesModal
                    employees={allEmployees}
                    loading={loadingEmployees}
                    onClose={() => setShowEmployeeModal(false)}
                    onAdd={handleAddEmployees}
                    alreadySelected={[]}
                />
            )}
        </div>
    );
}
