import { useEffect, useState, useMemo } from "react";
import type { LeaveRequest } from "../../types/leave.types";
import { LeaveRequestStatus, HolidaySession } from "../../types/enum/enum";
import { userApi } from "../../features/user/api/userApi";
import type { UserResponse } from "../../types/user.types";

interface Props {
    request: LeaveRequest;
    leaveTypeName: string;
    onClose: () => void;
    onCancel?: (id: string) => void;
    cancellingId?: string | null;
}

function formatDateFull(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSession(session: HolidaySession) {
    return session === HolidaySession.MORNING ? "08:30 AM" : "05:30 PM"; // Assuming standard times
}

function getInitials(name: string) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function LeaveRequestDetailsModal({ request, leaveTypeName, onClose, onCancel, cancellingId }: Props) {
    const [sendUsers, setSendUsers] = useState<UserResponse[]>([]);
    const [ccUsers, setCcUsers] = useState<UserResponse[]>([]);

    // Memoize parsed email lists to prevent unnecessary re-fetches and re-renders
    const sendEmails = useMemo(() => {
        const val = request.emailSend as any;
        if (Array.isArray(val)) return val.map((e: string) => e.trim()).filter(Boolean);
        if (typeof val === "string") return val.split(",").map((e: string) => e.trim()).filter(Boolean);
        return [];
    }, [request.emailSend]);

    const ccEmails = useMemo(() => {
        const val = request.emailCC as any;
        if (Array.isArray(val)) return val.map((e: string) => e.trim()).filter(Boolean);
        if (typeof val === "string") return val.split(",").map((e: string) => e.trim()).filter(Boolean);
        return [];
    }, [request.emailCC]);

    useEffect(() => {
        if (sendEmails.length > 0) {
            Promise.all(
                sendEmails.map((email: string) => userApi.findByEmail(email).catch(() => null))
            ).then(results => {
                setSendUsers(results.filter((r): r is UserResponse => r !== null));
            });
        } else {
            setSendUsers([]);
        }

        if (ccEmails.length > 0) {
            Promise.all(
                ccEmails.map((email: string) => userApi.findByEmail(email).catch(() => null))
            ).then(results => {
                setCcUsers(results.filter((r): r is UserResponse => r !== null));
            });
        } else {
            setCcUsers([]);
        }
    }, [sendEmails, ccEmails]);

    const canCancel = request.status === LeaveRequestStatus.PENDING || request.status === LeaveRequestStatus.DRAFT || request.status === LeaveRequestStatus.APPROVED;
    const isRejected = request.status === LeaveRequestStatus.REJECTED;

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading file:", error);
            // Fallback to generic navigation if fetch fails (e.g. CORS)
            window.open(url, "_blank");
        }
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "white", borderRadius: 20, width: 680, maxWidth: "95vw",
                    maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                    display: "flex", flexDirection: "column"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "24px 28px 20px", borderBottom: "1px solid #F1F5F9",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                            Request Details <span style={{ color: "#64748B", fontWeight: 500 }}>#{request.id.slice(0, 13).toUpperCase()}</span>
                        </h2>
                        <span style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                            background: request.status === "APPROVED" ? "#D1FAE5" : request.status === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                            color: request.status === "APPROVED" ? "#065F46" : request.status === "REJECTED" ? "#991B1B" : "#92400E",
                        }}>
                            {request.status.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* General Information */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
                            General Information
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Leave Type</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>{leaveTypeName}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Duration</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>{request.totalDays.toFixed(1)} Days</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Date Range</div>
                            <div style={{
                                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px",
                                display: "inline-flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: "#374151"
                            }}>
                                <span style={{ color: "#94A3B8" }}>📅</span>
                                <span>{formatDateFull(request.fromDate)}, {formatSession(request.fromSession)}</span>
                                <span style={{ color: "#CBD5E1" }}>→</span>
                                <span>{formatDateFull(request.toDate)}, {formatSession(request.toSession)}</span>
                            </div>
                        </div>

                        {request.reason && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Reason</div>
                                <div style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.5 }}>{request.reason}</div>
                            </div>
                        )}

                        {request.attachmentUrl && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Evidence & Attachments</div>
                                <div style={{
                                    border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    background: "white"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 8,
                                            background: request.attachmentUrl.toLowerCase().endsWith(".pdf") ? "#FEF2F2" : "#EFF6FF",
                                            color: request.attachmentUrl.toLowerCase().endsWith(".pdf") ? "#EF4444" : "#3B82F6",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                                        }}>
                                            {request.attachmentUrl.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️"}
                                        </div>
                                        <div>
                                            {/* Extract filename from URL or default to attachment */}
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                                                {request.attachmentUrl.split('/').pop() || "Attachment"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                                                {request.attachmentUrl.toLowerCase().endsWith(".pdf") ? "PDF Document" : "Image File"}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <a
                                            href={request.attachmentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5", textDecoration: "none" }}
                                        >
                                            View
                                        </a>
                                        <button
                                            onClick={() => handleDownload(request.attachmentUrl!, request.attachmentUrl!.split('/').pop() || "Attachment")}
                                            style={{
                                                fontSize: 13, fontWeight: 600, color: "#4F46E5",
                                                textDecoration: "none", background: "none", border: "none",
                                                padding: 0, cursor: "pointer"
                                            }}
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isRejected && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Rejection Reason</div>
                                <div style={{
                                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 16px",
                                    fontSize: 13, color: "#991B1B", lineHeight: 1.5
                                }}>
                                    Request rejected.
                                </div>
                            </div>
                        )}
                    </div>

                    <hr style={{ border: 0, borderTop: "1px solid #F1F5F9", margin: 0 }} />

                    {/* Approver & CC */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
                                Approver
                            </div>
                            {sendEmails.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {sendEmails.map((email: string, idx: number) => {
                                        const user = sendUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                                        const displayName = (user && user.fullName) ? user.fullName : email;
                                        const initialsInput = (user && user.fullName) ? user.fullName : email.split("@")[0].replace(/[._-]/g, " ");

                                        return (
                                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E0E7FF", color: "#4338CA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                                                    {getInitials(initialsInput)}
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                                                    {displayName}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>No approver email</div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
                                CC / Notify
                            </div>
                            {ccEmails.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {ccEmails.map((email: string, idx: number) => {
                                        const user = ccUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                                        const displayName = (user && user.fullName) ? user.fullName : email;
                                        const initialsInput = (user && user.fullName) ? user.fullName : email.split("@")[0].replace(/[._-]/g, " ");

                                        return (
                                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                                                    {getInitials(initialsInput)}
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                                                    {displayName}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>None</div>
                            )}
                        </div>
                    </div>

                    <hr style={{ border: 0, borderTop: "1px solid #F1F5F9", margin: 0 }} />

                    {/* Deducted Box */}
                    {(request.paidDays > 0 || request.unpaidDays > 0) && (
                        <div style={{
                            background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px 16px",
                            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1E3A8A"
                        }}>
                            <span>📋</span>
                            <span>
                                Deducted <strong>{request.paidDays.toFixed(1)} Days</strong> from {leaveTypeName}
                                {request.unpaidDays > 0 ? (
                                    <> and <strong>{request.unpaidDays.toFixed(1)} Days</strong> as Unpaid Leave (LWP)</>
                                ) : null}
                            </span>
                        </div>
                    )}

                    {/* Request Timeline */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
                            Request Timeline
                        </div>
                        <div style={{ position: "relative", paddingLeft: 12 }}>
                            <div style={{ position: "absolute", left: 16, top: 12, bottom: 0, width: 1, borderLeft: "1px dashed #CBD5E1" }} />

                            {/* Submitted Step */}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 1 }}>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", border: "2px solid white", outline: "2px solid #D1FAE5", marginTop: 4 }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Submitted</span>
                                </div>
                                <span style={{ fontSize: 13, color: "#64748B" }}>{formatDateFull(request.createdAt)}</span>
                            </div>

                            {/* Approved/Rejected Step */}
                            {request.approvedAt && (
                                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: request.status === "APPROVED" ? "#10B981" : "#EF4444", border: "2px solid white", outline: request.status === "APPROVED" ? "2px solid #D1FAE5" : "2px solid #FEE2E2", marginTop: 4 }} />
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                                            {request.status === "APPROVED" ? "Approved by Manager" : "Rejected by Manager"}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 13, color: "#64748B" }}>{formatDateFull(request.approvedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: "16px 28px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC",
                    display: "flex", justifyContent: "flex-end", gap: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20
                }}>
                    {canCancel && onCancel && (
                        <button
                            onClick={() => onCancel(request.id)}
                            disabled={cancellingId === request.id}
                            style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: "#EF4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 8,
                                boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)"
                            }}
                        >
                            {cancellingId === request.id ? (
                                <>
                                    <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "dh-spin 0.7s linear infinite" }} />
                                    Cancelling…
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: 16 }}>ⓧ</span> Cancel Request
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 20px", borderRadius: 8, border: "1px solid #CBD5E1",
                            background: "white", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
