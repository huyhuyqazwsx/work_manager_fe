import { useEffect, useState } from "react";
import { otPlanApi } from "../../features/ot-plan/api/otPlanApi";
import { otTicketApi } from "../../features/ot-ticket/api/otTicketApi";
import type { OTPlan, OTTicket, CreateOTTicketItemDto } from "../../types/ot.types";
import { OTPlanStatus, OTTicketStatus } from "../../types/enum/enum";
import { parseBackendError } from "../../utils/error.utils";

interface Props {
    planId: string;
    userId: string;
    employeeMap?: Record<string, string>; // code → fullName (for ticketPayload)
    userIdMap?: Record<string, string>;   // userId → fullName (for actual tickets)
    onBack: () => void;
    onRefresh?: () => void;
}

const toMin = (t: string) => {
    const [h, m] = (t ?? "00:00").split(":").map(Number);
    return h * 60 + m;
};

const fmtDate = (s: string) => {
    if (!s) return "—";
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const fmtTime = (s?: string | null): string => {
    if (!s) return "—";
    if (s.includes("T") || (s.includes("-") && s.length > 8)) {
        // ISO datetime string
        const d = new Date(s);
        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return s.slice(0, 5); // "HH:MM" or "HH:MM:SS"
};

const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
        DRAFT:     { bg: "#F1F5F9", color: "#475569" },
        PENDING:   { bg: "#FEF3C7", color: "#92400E" },
        APPROVED:  { bg: "#D1FAE5", color: "#065F46" },
        REJECTED:  { bg: "#FEE2E2", color: "#991B1B" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#475569" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, letterSpacing: "0.05em" }}>
            {status}
        </span>
    );
};

const ticketStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
        SCHEDULED:   { bg: "#DBEAFE", color: "#1D4ED8" },
        IN_PROGRESS: { bg: "#FEF3C7", color: "#92400E" },
        COMPLETED:   { bg: "#D1FAE5", color: "#065F46" },
        VERIFIED:    { bg: "#D1FAE5", color: "#065F46" },
        REJECTED:    { bg: "#FEE2E2", color: "#991B1B" },
        EXPIRED:     { bg: "#F1F5F9", color: "#6B7280" },
        CANCELLED:   { bg: "#F1F5F9", color: "#6B7280" },
    };
    const s = map[status] ?? { bg: "#F1F5F9", color: "#6B7280" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {status.replace("_", " ")}
        </span>
    );
};

const thStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    color: "var(--dh-gray-500)", background: "var(--dh-gray-50)", border: "none", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
    padding: "14px 16px", fontSize: 13, color: "#0F172A", borderBottom: "1px solid var(--dh-gray-100)", verticalAlign: "middle",
};

export default function OTPlanDetailView({ planId, userId, employeeMap = {}, userIdMap = {}, onBack, onRefresh }: Props) {
    const [plan, setPlan] = useState<OTPlan | null>(null);
    const [tickets, setTickets] = useState<OTTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const p = await otPlanApi.getPlanById(planId);
            setPlan(p);
            if (p.status === OTPlanStatus.APPROVED) {
                const t = await otTicketApi.getTicketsByPlan(planId);
                setTickets(t);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to load plan details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlan(); }, [planId]);

    const handleAction = async (action: "submit" | "cancel" | "delete") => {
        if (!plan) return;
        setActionLoading(true);
        setErrorMsg("");
        try {
            if (action === "submit") await otPlanApi.submitPlan(plan.id, userId);
            else if (action === "cancel") await otPlanApi.cancelPlan(plan.id, userId);
            else if (action === "delete") await otPlanApi.deletePlan(plan.id, userId);
            onRefresh?.();
            onBack();
        } catch (err: any) {
            setErrorMsg(parseBackendError(err, `Failed to ${action} plan`));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80, color: "var(--dh-gray-400)" }}>
            Loading plan details...
        </div>
    );

    if (!plan) return (
        <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>{errorMsg || "Plan not found."}</div>
    );

    const raw = plan.ticketPayload;
    const payload: CreateOTTicketItemDto[] =
        Array.isArray(raw) ? raw :
        (raw && typeof raw === "object" && Array.isArray((raw as any).tickets))
            ? (raw as any).tickets
            : [];
    const isDraft = plan.status === OTPlanStatus.DRAFT;
    const isPending = plan.status === OTPlanStatus.PENDING;
    const isApproved = plan.status === OTPlanStatus.APPROVED;
    const shortId = `#OTP-${plan.id.slice(-8).toUpperCase()}`;

    return (
        <div style={{ marginTop: 24 }}>
            {/* Back button */}
            <button
                onClick={onBack}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#3B82F6", fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}
            >
                ← OT Plan Detail
            </button>

            {/* Plan header card */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{shortId}</span>
                    {statusBadge(plan.status)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--dh-gray-500)", fontSize: 13 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {plan.reason}
                </div>
                {plan.rejectionNote && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
                        Rejection note: {plan.rejectionNote}
                    </div>
                )}
            </div>

            {/* Error banner */}
            {errorMsg && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>⚠ {errorMsg}</span>
                    <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C1C", fontSize: 16 }}>×</button>
                </div>
            )}

            {/* ── DRAFT / PENDING: show ticketPayload ── */}
            {(isDraft || isPending) && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden", marginBottom: 24 }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--dh-gray-100)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dh-gray-500)" }}>Employee Assignment</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--dh-gray-200)" }}>
                                    <th style={{ ...thStyle, textAlign: "center" }}>No.</th>
                                    <th style={thStyle}>Employee</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Date Range</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Time Range</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Est. Hours / Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payload.length === 0 ? (
                                    <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "var(--dh-gray-400)", padding: 32 }}>No assignment data.</td></tr>
                                ) : payload.map((item, idx) => {
                                    const est = (toMin(item.endTime) - toMin(item.startTime)) / 60;
                                    const name = employeeMap[item.employeeCode];
                                    return (
                                        <tr key={idx}>
                                            <td style={{ ...tdStyle, textAlign: "center", color: "var(--dh-gray-500)", width: 60 }}>{String(idx + 1).padStart(2, "0")}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#64748B", flexShrink: 0 }}>
                                                        {(name ?? item.employeeCode).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        {name && <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{name}</div>}
                                                        <div style={{ fontSize: 12, color: "var(--dh-gray-500)" }}>{item.employeeCode}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                                <span style={{ background: "var(--dh-gray-100)", padding: "5px 12px", borderRadius: 8, fontSize: 13, display: "inline-block" }}>
                                                    {item.startDate === item.endDate
                                                        ? fmtDate(item.startDate)
                                                        : `${fmtDate(item.startDate)} – ${fmtDate(item.endDate)}`}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                                <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "inline-block" }}>
                                                    {item.startTime} – {item.endTime}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                                                {est > 0 ? est.toFixed(1) : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── APPROVED: show tickets ── */}
            {isApproved && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden", marginBottom: 24 }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--dh-gray-100)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dh-gray-500)" }}>OT Tickets</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--dh-gray-200)" }}>
                                    <th style={thStyle}>No.</th>
                                    <th style={thStyle}>Employee</th>
                                    <th style={thStyle}>Ticket ID</th>
                                    <th style={thStyle}>Date & Time</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Est. Hrs</th>
                                    <th style={thStyle}>Type</th>
                                    <th style={thStyle}>Planned Task</th>
                                    <th style={thStyle}>Actual Task</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Check-in</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Check-out</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Duration</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr><td colSpan={12} style={{ ...tdStyle, textAlign: "center", color: "var(--dh-gray-400)", padding: 32 }}>No tickets yet.</td></tr>
                                ) : tickets.map((t, idx) => {
                                    const empName = userIdMap[t.userId];
                                    return (
                                    <tr key={t.id}>
                                        <td style={{ ...tdStyle, color: "var(--dh-gray-500)" }}>{String(idx + 1).padStart(2, "0")}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#64748B", flexShrink: 0 }}>
                                                    {(empName ?? t.userId).charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>
                                                    {empName ?? <span style={{ color: "var(--dh-gray-400)", fontStyle: "italic" }}>Unknown</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 600, fontSize: 12, color: "#3B82F6", fontFamily: "monospace" }}>
                                            {t.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{fmtDate(t.workDate)}</div>
                                            <div style={{ fontSize: 12, color: "var(--dh-gray-500)" }}>{fmtTime(t.startTime)} – {fmtTime(t.endTime)}</div>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                                            {t.totalHours?.toFixed(1) ?? "—"}
                                        </td>
                                        <td style={tdStyle}>
                                            {t.otType ? (
                                                <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: t.otType === "SALARY" ? "#EFF6FF" : "#F0FDF4", color: t.otType === "SALARY" ? "#1D4ED8" : "#166534" }}>
                                                    {t.otType === "SALARY" ? "Field OT" : "Compensatory"}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.plan ?? "—"}
                                        </td>
                                        <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.result ?? "—"}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>{fmtTime(t.checkIn)}</td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>{fmtTime(t.checkOut)}</td>
                                        <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600 }}>
                                            {t.actualHours != null ? `${t.actualHours.toFixed(1)}h` : "—"}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>
                                            {ticketStatusBadge(t.status)}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                {isDraft && (<>
                    <button
                        onClick={() => handleAction("delete")}
                        disabled={actionLoading}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #EF4444", background: "white", color: "#EF4444", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    >
                        Delete
                    </button>
                    <button
                        disabled={actionLoading}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid var(--dh-gray-300)", background: "white", color: "var(--dh-gray-700)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleAction("submit")}
                        disabled={actionLoading}
                        style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1E3A8A", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    >
                        {actionLoading ? "Submitting..." : "Submit"}
                    </button>
                </>)}

                {isPending && (
                    <button
                        onClick={() => handleAction("cancel")}
                        disabled={actionLoading}
                        style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    >
                        {actionLoading ? "Cancelling..." : "Cancel Plan"}
                    </button>
                )}
            </div>
        </div>
    );
}
