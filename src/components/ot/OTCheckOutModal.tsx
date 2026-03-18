import { useState, useEffect } from "react";
import type { OTTicket } from "../../types/ot.types";
import { toast } from "../toast/toast";

interface OTCheckOutModalProps {
    ticket: OTTicket;
    onClose: () => void;
    onConfirm: (result: string) => Promise<void>;
}

export default function OTCheckOutModal({ ticket, onClose, onConfirm }: OTCheckOutModalProps) {
    const [result, setResult] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState("00:00:00");

    useEffect(() => {
        if (!ticket.checkIn) return;

        const checkInTime = new Date(ticket.checkIn).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, now - checkInTime);
            
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            setElapsedTime(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            );
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [ticket.checkIn]);

    const handleSubmit = async () => {
        if (!result.trim()) { toast.error("Vui lòng nhập kết quả công việc!"); return; }
        
        setSubmitting(true);
        try {
            await onConfirm(result.trim());
        } catch (err) {
            // Error handling usually in parent
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="dh-modal-overlay">
            <div className="dh-modal" style={{ width: 440, padding: 0, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Stop Timer & Check-out</h2>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: "var(--dh-gray-400)", cursor: "pointer" }}>×</button>
                </div>

                {/* Timer Section */}
                <div style={{ background: "#FFFBF2", padding: "32px 28px", textAlign: "center", borderTop: "1px solid var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-50)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Total Worked</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>🕒</span>
                        <span style={{ fontSize: 44, fontWeight: 800, color: "#1F2937", fontFamily: "monospace" }}>{elapsedTime}</span>
                    </div>
                </div>

                {/* Planned Info */}
                <div style={{ padding: "20px 28px" }}>
                    <div style={{ background: "var(--dh-gray-50)", borderRadius: 12, padding: 16, border: "1px solid var(--dh-gray-100)", display: "flex", gap: 12 }}>
                        <div style={{ fontSize: 18 }}>📄</div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dh-gray-400)", textTransform: "uppercase" }}>You planned to do</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dh-gray-700)", marginTop: 2 }}>{ticket.plan || "---"}</div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div style={{ padding: "0 28px 28px" }}>
                    <div style={{ marginBottom: 24 }}>
                        <label className="dh-modal-label">Actual Output / Result <span style={{ color: "#EF4444" }}>*</span></label>
                        <textarea 
                            className="dh-modal-textarea"
                            value={result}
                            onChange={e => setResult(e.target.value)}
                            placeholder="Describe what you accomplished..."
                            style={{ minHeight: 120 }}
                        />
                    </div>

                    <div className="dh-modal-actions" style={{ gap: 12 }}>
                        <button className="dh-modal-cancel-btn" style={{ flex: 1, height: 44 }} onClick={onClose} disabled={submitting}>Cancel</button>
                        <button 
                            className="dh-modal-confirm-btn" 
                            style={{ flex: 2, height: 44, background: "#F97316", color: "white" }} 
                            onClick={handleSubmit} 
                            disabled={submitting}
                        >
                            <span style={{ marginRight: 8 }}>✓</span> {submitting ? "Processing..." : "Submit & Check-out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
