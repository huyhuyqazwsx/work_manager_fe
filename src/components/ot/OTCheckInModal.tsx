import { useState, useEffect } from "react";
import { OTType } from "../../types/enum/enum";
import type { OTTicket, CheckInOtTicketDto } from "../../types/ot.types";
import { toast } from "../toast/toast";

interface OTCheckInModalProps {
    ticket: OTTicket;
    onClose: () => void;
    onConfirm: (dto: CheckInOtTicketDto) => Promise<void>;
}

const fmtModalTime = (s?: string | null): string => {
    if (!s) return "—";
    if (s.includes("T") || (s.includes("-") && s.length > 8)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return s.slice(0, 5);
};

export default function OTCheckInModal({ ticket, onClose, onConfirm }: OTCheckInModalProps) {
    const [workPlan, setWorkPlan] = useState("");
    const [otType, setOtType] = useState<OTType>(ticket.otType || OTType.COMPENSATION);
    const [submitting, setSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async () => {
        if (!workPlan.trim()) { toast.error("Vui lòng nhập nội dung kế hoạch làm việc!"); return; }
        
        setSubmitting(true);
        try {
            await onConfirm({
                workPlan,
                otType
            });
        } catch (err) {
            // Error handling usually in parent
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="dh-modal-overlay">
            <div className="dh-modal" style={{ width: 500, padding: 0, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--dh-gray-100)", position: "relative" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Start Timer & Check-in</h2>
                    <div style={{ fontSize: 13, color: "var(--dh-gray-400)", marginTop: 4 }}>
                        Check-in for Ticket <span style={{ color: "var(--dh-primary)", fontWeight: 600, fontFamily: "monospace" }}>{ticket.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "transparent", border: "none", fontSize: 20, color: "var(--dh-gray-400)", cursor: "pointer" }}>×</button>
                </div>

                {/* Ticket Info Card */}
                <div style={{ padding: "16px 28px" }}>
                    <div style={{ background: "var(--dh-gray-50)", border: "1px solid var(--dh-gray-100)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "white", border: "1px solid var(--dh-gray-200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📄</div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dh-gray-400)", textTransform: "uppercase" }}>Plan</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dh-gray-700)" }}>{ticket.plan || "No plan specified"}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--dh-gray-100)", paddingTop: 12 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "white", border: "1px solid var(--dh-gray-200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🕒</div>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dh-gray-400)", textTransform: "uppercase" }}>Scheduled</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dh-gray-700)" }}>
                                        {fmtModalTime(ticket.startTime)} – {fmtModalTime(ticket.endTime)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", fontSize: 16 }}>🕒</div>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dh-gray-400)", textTransform: "uppercase" }}>Current Time</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div style={{ padding: "0 28px 28px" }}>
                    <div style={{ marginBottom: 20 }}>
                        <label className="dh-modal-label">What will you work on? <span style={{ color: "#EF4444" }}>*</span></label>
                        <textarea 
                            className="dh-modal-textarea"
                            value={workPlan}
                            onChange={e => setWorkPlan(e.target.value)}
                            placeholder="E.g., Fixing bug #123, Support UAT..."
                            style={{ minHeight: 120 }}
                        />
                    </div>

                    <div>
                        <label className="dh-modal-label">Work Mode <span style={{ color: "#EF4444" }}>*</span></label>
                        <select 
                            className="dh-filter-select" 
                            style={{ width: "100%" }}
                            value={otType}
                            onChange={e => setOtType(e.target.value as OTType)}
                        >
                            <option value={OTType.COMPENSATION}>Compensatory Work</option>
                            <option value={OTType.SALARY}>Paid Overtime</option>
                        </select>
                    </div>

                    <div className="dh-modal-actions" style={{ marginTop: 24 }}>
                        <button className="dh-modal-cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button 
                            className="dh-modal-confirm-btn" 
                            style={{ background: "#1E3A8A", minWidth: 160 }} 
                            onClick={handleSubmit} 
                            disabled={submitting}
                        >
                            <span style={{ marginRight: 8 }}>ℹ️</span> {submitting ? "Processing..." : "Confirm & Check-in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
