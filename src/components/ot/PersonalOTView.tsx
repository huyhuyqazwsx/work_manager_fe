import React, { useEffect, useState } from "react";
import { compensationApi } from "../../features/compensation/api/compensationApi";
import type { CompensationBalance } from "../../types/compensation.types";
import { otTicketApi } from "../../features/ot-ticket/api/otTicketApi";
import type { OTTicket, CheckInOtTicketDto } from "../../types/ot.types";
import OTCheckInModal from "./OTCheckInModal";
import OTCheckOutModal from "./OTCheckOutModal";
import { parseBackendError } from "../../utils/error.utils";
import { toast } from "../toast/toast";


interface PersonalOTViewProps {
    userId: string;
}

export default function PersonalOTView({ userId }: PersonalOTViewProps) {
    const [balance, setBalance] = useState<CompensationBalance | null>(null);
    const [tickets, setTickets] = useState<OTTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // ticketId

    const [checkInTarget, setCheckInTarget] = useState<OTTicket | null>(null);
    const [checkOutTarget, setCheckOutTarget] = useState<OTTicket | null>(null);

    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Compensation Balance
                const bal = await compensationApi.getBalance(userId);
                setBalance(bal);

                // Fetch My Tickets
                const myTickets = await otTicketApi.getMyTickets();
                setTickets(myTickets);
            } catch (err) {
                console.error("Failed to load OT data", err);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [userId]);

    // Calculate OT hours this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const otHoursThisMonth = tickets
        .filter(t => {
            const d = new Date(t.workDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.actualHours;
        })
        .reduce((sum, t) => sum + (t.actualHours || 0), 0);

    const compHours = balance?.hours ?? 0;
    const isDeficit = compHours < 0;

    // Pagination
    const totalPages = Math.ceil(tickets.length / limit);
    const paginatedTickets = tickets.slice((page - 1) * limit, page * limit);

    const paginationBtnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
        minWidth: 32,
        height: 32,
        padding: "0 8px",
        border: active ? "none" : "1px solid var(--dh-gray-200)",
        borderRadius: 8,
        background: active ? "var(--dh-primary, #3B82F6)" : "white",
        color: active ? "white" : disabled ? "var(--dh-gray-300)" : "var(--dh-gray-700)",
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
    });

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return "---";
        // If it's an ISO string (contains 'T' or '-'), parse it
        if (timeStr.includes("T") || timeStr.includes("-")) {
            try {
                const date = new Date(timeStr);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch {
                return timeStr.slice(0, 5);
            }
        }
        // If it's HH:mm:ss, slice it
        return timeStr.slice(0, 5); 
    };

    // Parse a time field that may be "HH:MM", "HH:MM:SS", or a full ISO datetime string.
    // Returns a Date object on the same calendar day as workDate (local time).
    const parseShiftTime = (workDate: string, timeStr: string): Date => {
        if (!timeStr) return new Date(NaN);
        if (timeStr.includes("T") || (timeStr.includes("-") && timeStr.length > 8)) {
            // Full ISO datetime — use directly
            return new Date(timeStr);
        }
        // "HH:MM" or "HH:MM:SS"
        const [h, m] = timeStr.split(":").map(Number);
        const d = new Date(workDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const handleCancel = async (ticketId: string) => {
        setActionLoading(ticketId);
        try {
            const updated = await otTicketApi.cancel(ticketId);
            setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
            toast.success("Ticket đã được hủy thành công.");
        } catch (err: any) {
            toast.error(parseBackendError(err, "Hủy ticket thất bại."));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckIn = async (dto: CheckInOtTicketDto) => {
        if (!checkInTarget) return;
        const id = checkInTarget.id;

        setActionLoading(id);
        try {
            const updated = await otTicketApi.checkIn(id, dto);
            setTickets(prev => prev.map(t => t.id === id ? updated : t));
            setCheckInTarget(null);
            toast.success("Check-in thành công!");
        } catch (err: any) {
            toast.error(parseBackendError(err, "Check-in thất bại."));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckOut = async (result: string) => {
        if (!checkOutTarget) return;
        const id = checkOutTarget.id;

        setActionLoading(id);
        try {
            const updated = await otTicketApi.checkOut(id, result);
            setTickets(prev => prev.map(t => t.id === id ? updated : t));
            setCheckOutTarget(null);
            toast.success("Check-out thành công!");
        } catch (err: any) {
            toast.error(parseBackendError(err, "Check-out thất bại."));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{ marginTop: 24 }}>
            {/* Header */}
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>
                My OT Schedule
            </h2>

            {/* Dashboard Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                {/* Compensatory Fund Card */}
                <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", padding: 24, position: "relative" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dh-gray-500)", marginBottom: 12 }}>
                        Compensatory Fund
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: isDeficit ? "#EF4444" : "#10B981", letterSpacing: "-0.02em" }}>
                            {isDeficit ? "" : "+"}{compHours.toFixed(1)} Hours
                        </span>
                        {isDeficit && (
                            <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                DEFICIT
                            </span>
                        )}
                    </div>
                    {isDeficit && (
                        <div style={{ fontSize: 12, color: "var(--dh-gray-400)", marginTop: 4 }}>
                            Requires makeup
                        </div>
                    )}
                    <span style={{ position: "absolute", top: 24, right: 24, fontSize: 24, background: "#FEF2F2", color: "#EF4444", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                        📅
                    </span>
                </div>

                {/* OT Hours This Month */}
                <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", padding: 24, position: "relative" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dh-gray-500)", marginBottom: 12 }}>
                        OT Hours This Month
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                        {otHoursThisMonth.toFixed(1)} Hours
                    </div>
                    <span style={{ position: "absolute", top: 24, right: 24, fontSize: 24, background: "#EFF6FF", color: "#3B82F6", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                        🕒
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <select style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14 }}>
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="inprogress">Inprogress</option>
                    <option value="verified">Verified</option>
                </select>
                <input type="text" placeholder="Search ticket..." style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, flex: 1, maxWidth: 300 }} />
                <select style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--dh-gray-200)", outline: "none", fontSize: 14, marginLeft: "auto" }}>
                    <option value="current">{String(currentMonth + 1).padStart(2, '0')}/{currentYear}</option>
                </select>
            </div>

            {/* Table */}
            <div className="dh-table-card" style={{ background: "white", borderRadius: 16, border: "1px solid var(--dh-gray-200)", overflow: "hidden" }}>
                <div className="dh-table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="dh-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--dh-gray-50)", borderBottom: "1px solid var(--dh-gray-200)" }}>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>No</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Ticket ID</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Date & Time</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Type</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Planned Task</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Actual Task</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Check-in</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Check-out</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Duration</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Status</th>
                                <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--dh-gray-500)", border: "none" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>Loading...</div>
                                    </td>
                                </tr>
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={11}>
                                        <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "var(--dh-gray-400)" }}>No tickets found</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((t, idx) => (
                                    <tr key={t.id} style={{ borderBottom: "1px solid var(--dh-gray-100)" }}>
                                        <td style={{ padding: "16px 20px", color: "var(--dh-gray-500)", fontWeight: 500 }}>
                                            {String((page - 1) * limit + idx + 1).padStart(2, '0')}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13, fontFamily: "monospace" }}>
                                                {t.id.slice(0, 8).toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--dh-gray-400)" }}>
                                                ...{t.id.slice(-4).toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: 13 }}>
                                            <div style={{ fontWeight: 600, color: "#0F172A" }}>{new Date(t.workDate).toLocaleDateString('en-GB')}</div>
                                            <div style={{ fontSize: 12, color: "var(--dh-gray-500)" }}>{formatTime(t.startTime)} - {formatTime(t.endTime)}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            {t.otType === 'SALARY' ? (
                                                <span style={{ padding: "4px 8px", background: "#D1FAE5", color: "#065F46", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Paid OT</span>
                                            ) : (
                                                <span style={{ padding: "4px 8px", background: "#F3E8FF", color: "#6B21A8", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Compensatory</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-900)" }}>
                                            {t.plan || "---"}
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-500)" }}>
                                            {t.result || "---"}
                                        </td>
                                        {/* ── Check-in cell ── */}
                                        <td style={{ padding: "12px 20px", fontSize: 13 }}>
                                            {(() => {
                                                if (t.checkIn) {
                                                    return <span style={{ fontWeight: 600, color: "#0F172A" }}>{formatTime(t.checkIn)}</span>;
                                                }
                                                // Compute enable window: 0:00 of workDate → workDate+endTime
                                                const now = new Date();
                                                const wd = new Date(t.workDate);
                                                const dayStart = new Date(wd); dayStart.setHours(0, 0, 0, 0);
                                                const shiftEnd = parseShiftTime(t.workDate, t.endTime ?? "23:59");
                                                const canCheckIn = t.status === "SCHEDULED" && now >= dayStart && now <= shiftEnd;
                                                const isLoading = actionLoading === t.id;
                                                return (
                                                    <button
                                                        onClick={() => canCheckIn && !actionLoading && setCheckInTarget(t)}
                                                        disabled={!canCheckIn || !!actionLoading}
                                                        title={!canCheckIn ? (now < dayStart ? "Check-in opens at 0:00 on shift day" : "Check-in window has closed") : "Check in now"}
                                                        style={{
                                                            padding: "4px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid",
                                                            background: canCheckIn ? "#EFF6FF" : "#F8FAFC",
                                                            color: canCheckIn ? "#3B82F6" : "#94A3B8",
                                                            borderColor: canCheckIn ? "#BFDBFE" : "#E2E8F0",
                                                            cursor: canCheckIn && !actionLoading ? "pointer" : "not-allowed",
                                                            opacity: isLoading ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {isLoading ? "..." : "⚙ Check in"}
                                                    </button>
                                                );
                                            })()}
                                        </td>

                                        {/* ── Check-out cell ── */}
                                        <td style={{ padding: "12px 20px", fontSize: 13 }}>
                                            {(() => {
                                                if (t.checkOut) {
                                                    return <span style={{ fontWeight: 600, color: "#0F172A" }}>{formatTime(t.checkOut)}</span>;
                                                }
                                                if (t.status !== "IN_PROGRESS" || !t.checkIn) {
                                                    return <span style={{ color: "var(--dh-gray-300)" }}>—</span>;
                                                }
                                                // Enabled: checkIn time → checkIn + 24h
                                                const now = new Date();
                                                const checkInTime = new Date(t.checkIn);
                                                const deadline = new Date(checkInTime.getTime() + 24 * 60 * 60 * 1000);
                                                const canCheckOut = now <= deadline;
                                                const isLoading = actionLoading === t.id;
                                                return (
                                                    <button
                                                        onClick={() => canCheckOut && !actionLoading && setCheckOutTarget(t)}
                                                        disabled={!canCheckOut || !!actionLoading}
                                                        title={!canCheckOut ? "Check-out window expired (24h)" : "Check out now"}
                                                        style={{
                                                            padding: "4px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid",
                                                            background: canCheckOut ? "#FFF7ED" : "#F8FAFC",
                                                            color: canCheckOut ? "#F97316" : "#94A3B8",
                                                            borderColor: canCheckOut ? "#FED7AA" : "#E2E8F0",
                                                            cursor: canCheckOut && !actionLoading ? "pointer" : "not-allowed",
                                                            opacity: isLoading ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {isLoading ? "..." : "⚙ Check out"}
                                                    </button>
                                                );
                                            })()}
                                        </td>

                                        <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--dh-gray-500)" }}>
                                            {t.actualHours ? `${t.actualHours}h` : "—"}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                                background: t.status === "VERIFIED" ? "#F5F3FF" : t.status === "IN_PROGRESS" ? "#FFFBEB" : t.status === "COMPLETED" ? "#D1FAE5" : t.status === "CANCELLED" ? "#F1F5F9" : t.status === "EXPIRED" ? "#FEF2F2" : "#EFF6FF",
                                                color: t.status === "VERIFIED" ? "#6D28D9" : t.status === "IN_PROGRESS" ? "#B45309" : t.status === "COMPLETED" ? "#065F46" : t.status === "CANCELLED" ? "#64748B" : t.status === "EXPIRED" ? "#DC2626" : "#2563EB",
                                            }}>
                                                {t.status.replace("_", " ")}
                                            </span>
                                        </td>

                                        {/* ── Actions: Cancel only ── */}
                                        <td style={{ padding: "12px 20px" }}>
                                            {(() => {
                                                if (t.status !== "SCHEDULED") return <span style={{ color: "var(--dh-gray-300)", fontSize: 13 }}>—</span>;
                                                const now = new Date();
                                                const shiftStart = parseShiftTime(t.workDate, t.startTime ?? "00:00");
                                                const canCancel = now < shiftStart;
                                                const isLoading = actionLoading === t.id;
                                                return (
                                                    <button
                                                        onClick={() => canCancel && !actionLoading && handleCancel(t.id)}
                                                        disabled={!canCancel || !!actionLoading}
                                                        title={!canCancel ? "Cannot cancel after shift has started" : "Cancel this ticket"}
                                                        style={{
                                                            padding: "4px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid",
                                                            background: canCancel ? "#FEF2F2" : "#F8FAFC",
                                                            color: canCancel ? "#EF4444" : "#94A3B8",
                                                            borderColor: canCancel ? "#FECACA" : "#E2E8F0",
                                                            cursor: canCancel && !actionLoading ? "pointer" : "not-allowed",
                                                            opacity: isLoading ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {isLoading ? "..." : "✕ Cancel"}
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--dh-gray-200)", background: "white" }}>
                        <span style={{ fontSize: 13, color: "var(--dh-gray-500)" }}>
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, tickets.length)} of {tickets.length} results
                        </span>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button onClick={() => setPage(1)} disabled={page === 1} style={paginationBtnStyle(false, page === 1)}>⟨⟨</button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginationBtnStyle(false, page === 1)}>⟨</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} style={paginationBtnStyle(page === p, false)}>{p}</button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={paginationBtnStyle(false, page === totalPages)}>⟩</button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={paginationBtnStyle(false, page === totalPages)}>⟩⟩</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {checkInTarget && (
                <OTCheckInModal 
                    ticket={checkInTarget}
                    onClose={() => setCheckInTarget(null)}
                    onConfirm={handleCheckIn}
                />
            )}
            {checkOutTarget && (
                <OTCheckOutModal 
                    ticket={checkOutTarget}
                    onClose={() => setCheckOutTarget(null)}
                    onConfirm={handleCheckOut}
                />
            )}
        </div>
    );
}
