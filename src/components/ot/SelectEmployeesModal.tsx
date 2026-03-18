import { useState } from "react";

interface Employee {
    code: string;
    name: string;
}

interface SelectEmployeesModalProps {
    employees: Employee[];
    loading: boolean;
    alreadySelected: string[];
    onClose: () => void;
    onAdd: (employees: Employee[]) => void;
}

export default function SelectEmployeesModal({ employees, loading, alreadySelected, onClose, onAdd }: SelectEmployeesModalProps) {
    const [search, setSearch] = useState("");
    const [localSelected, setLocalSelected] = useState<string[]>([]);

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (code: string) => {
        if (localSelected.includes(code)) {
            setLocalSelected(localSelected.filter(c => c !== code));
        } else {
            setLocalSelected([...localSelected, code]);
        }
    };

    const toggleSelectAll = () => {
        if (localSelected.length === filteredEmployees.length && filteredEmployees.length > 0) {
            setLocalSelected([]);
        } else {
            setLocalSelected(filteredEmployees.map(e => e.code));
        }
    };

    const handleConfirm = () => {
        const selectedEmps = employees.filter(e => localSelected.includes(e.code));
        onAdd(selectedEmps);
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", width: 600, maxHeight: "90vh", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
                {/* Header */}
                <div style={{ padding: "24px 32px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>Select Employees</h2>
                        <div style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>Department: Technology Center (TTPTCN)</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "var(--dh-gray-400)", cursor: "pointer" }}>×</button>
                </div>

                {/* Search & Select All */}
                <div style={{ padding: "0 32px 16px" }}>
                    <div style={{ position: "relative", marginBottom: 16 }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--dh-gray-400)" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or job title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: 8, border: "none", background: "#F8FAFC", outline: "none", fontSize: 14, boxSizing: "border-box" }}
                        />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14, color: "var(--dh-gray-700)" }}>
                        <input
                            type="checkbox"
                            checked={localSelected.length === filteredEmployees.length && filteredEmployees.length > 0}
                            onChange={toggleSelectAll}
                            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#10B981" }}
                        />
                        Select All ({filteredEmployees.length} Employees)
                    </label>
                </div>

                {/* Employee List */}
                <div style={{ overflowY: "auto", flex: 1, padding: "0 32px", marginBottom: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filteredEmployees.map(emp => {
                            const isSelected = localSelected.includes(emp.code);
                            return (
                                <div key={emp.code} onClick={() => toggleSelect(emp.code)} style={{
                                    display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                                    background: isSelected ? "#F0FDF4" : "#F8FAFC",
                                    border: isSelected ? "1px solid #BBF7D0" : "1px solid transparent",
                                    transition: "all 0.2s"
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}} /* Handled by parent div */
                                        style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#10B981" }}
                                    />
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#64748B", fontSize: 14, position: "relative" }}>
                                        {emp.name.charAt(0)}
                                        {/* Status indicator dot */}
                                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#10B981", borderRadius: "50%", border: "2px solid white" }}></div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{emp.name}</div>
                                        <div style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>{emp.code}</div>
                                    </div>
                                </div>
                            );
                        })}
                        {loading && (
                            <div style={{ padding: 40, textAlign: "center", color: "var(--dh-gray-400)" }}>
                                Loading employees...
                            </div>
                        )}
                        {!loading && filteredEmployees.length === 0 && (
                            <div style={{ padding: 40, textAlign: "center", color: "var(--dh-gray-400)" }}>
                                No employees found
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "24px 32px", borderTop: "1px solid var(--dh-gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dh-gray-700)" }}>
                        Selected: {localSelected.length}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", background: "white", color: "var(--dh-gray-700)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={localSelected.length === 0}
                            style={{
                                padding: "10px 24px", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: localSelected.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8,
                                background: localSelected.length > 0 ? "#10B981" : "#A7F3D0", color: "white"
                            }}
                        >
                            Add to Plan <span>⊕</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
