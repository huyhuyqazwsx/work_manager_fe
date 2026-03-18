import { useEffect, useRef, useState } from "react";
import { leaveApi } from "../../../features/leave/api/leaveApi";
import { leaveTypeApi } from "../../../features/leave-type/api/leaveTypeApi";
import type { LeaveType } from "../../../types/leave-type.types";
import type {
    CreateLeaveRequestDto,
    PreviewLeaveResponseDto,
} from "../../../types/leave.types";
import { HolidaySession } from "../../../types/enum/enum";
import LeaveDatePicker, { type DatePickerValue } from "./LeaveDatePicker";
import { getUserFromStorage } from "../../../utils/auth.utils";

interface Props {
    userId: string;
    onClose: () => void;
    onSubmitted: () => void;
}

export default function NewLeaveRequestModal({ userId, onClose, onSubmitted }: Props) {
    /* ─── Form state ─── */
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveTypeId, setLeaveTypeId] = useState("");
    const [datePicker, setDatePicker] = useState<DatePickerValue>({
        fromDate: "",
        toDate: "",
        fromSession: HolidaySession.MORNING,
        toSession: HolidaySession.AFTERNOON,
    });
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    /* ─── Preview state ─── */
    const [preview, setPreview] = useState<PreviewLeaveResponseDto | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ─── Load leave types ─── */
    useEffect(() => {
        leaveTypeApi.findAll().then((types) => {
            setLeaveTypes(types);
            if (types.length > 0) setLeaveTypeId(types[0].id);
        });
    }, []);

    /* ─── Trigger preview whenever selection changes ─── */
    useEffect(() => {
        const { fromDate, toDate, fromSession, toSession } = datePicker;
        if (!leaveTypeId || !fromDate || !toDate) {
            setPreview(null);
            return;
        }
        if (previewDebounce.current) clearTimeout(previewDebounce.current);
        previewDebounce.current = setTimeout(async () => {
            setPreviewLoading(true);
            try {
                const user = getUserFromStorage();
                const res = await leaveApi.previewLeaveRequest({
                    userCode: user?.code || "",
                    leaveTypeCode: leaveTypes.find(l => l.id === leaveTypeId)?.code as any,
                    fromDate,
                    toDate,
                    fromSession,
                    toSession,
                });
                setPreview(res);
            } catch (err: any) {
                const data = err?.response?.data;
                const status = err?.response?.status;
                if ((status >= 400 && status < 500) || data?.errorCode) {
                    const msg = data?.message || "Invalid leave range";
                    setPreview({
                        actualLeaveDays: 0,
                        paidDays: 0,
                        unpaidDays: 0,
                        weekendDays: 0,
                        holidayDays: 0,
                        warnings: [msg],
                    });
                } else {
                    setPreview(null);
                }
            } finally {
                setPreviewLoading(false);
            }
        }, 500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leaveTypeId, datePicker]);

    /* ─── Submit ─── */
    const handleSubmit = async () => {
        const { fromDate, toDate, fromSession, toSession } = datePicker;
        if (!leaveTypeId || !fromDate || !toDate) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const dto: CreateLeaveRequestDto = {
                userId,
                leaveTypeCode: leaveTypes.find((l) => l.id === leaveTypeId)?.code as any,
                fromDate,
                toDate,
                fromSession,
                toSession,
                reason: reason || undefined,
            };
            await leaveApi.create(dto);
            onSubmitted();
        } catch (err: any) {
            const data = err?.response?.data;
            if (data?.errorCode) {
                if (data.errorCode === "VALIDATION_ERROR" && Array.isArray(data.details) && data.details.length > 0) {
                    const detailsStr = data.details.map((d: any) => `${d.field}: ${d.errors.join(", ")}`).join(" | ");
                    setSubmitError(`${data.message}: ${detailsStr}`);
                } else {
                    setSubmitError(data.message || `Error: ${data.errorCode}`);
                }
            } else {
                setSubmitError(data?.message ?? "Failed to submit request");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const isValid = leaveTypeId && datePicker.fromDate && datePicker.toDate && (!preview || preview.actualLeaveDays > 0);
    const isInsufficient = preview ? preview.unpaidDays > 0 : false;
    const hasWarnings = (preview?.warnings?.length ?? 0) > 0;

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
                    background: "white", borderRadius: 20, width: 880, maxWidth: "95vw",
                    maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "24px 28px 20px", borderBottom: "1px solid #F1F5F9",
                }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                        New Leave Request
                    </h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#94A3B8", lineHeight: 1 }}>×</button>
                </div>

                {/* ── Body ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    {/* Left: Form */}
                    <div style={{ padding: "24px 28px", borderRight: "1px solid #F1F5F9" }}>
                        {/* Leave Type */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Leave Type <Req /></label>
                            <select
                                value={leaveTypeId}
                                onChange={(e) => setLeaveTypeId(e.target.value)}
                                style={inputStyle}
                            >
                                {leaveTypes.map((lt) => (
                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date & Shift picker */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Select Leave Period <Req /></label>
                            <LeaveDatePicker value={datePicker} onChange={setDatePicker} />

                            {/* Summary row under picker */}
                            {datePicker.fromDate && datePicker.toDate && (
                                <div style={{
                                    marginTop: 10,
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 8,
                                }}>
                                    <div style={summaryBoxStyle}>
                                        <span style={summaryLabelStyle}>Start</span>
                                        <span style={summaryValueStyle}>{fmtDate(datePicker.fromDate)}</span>
                                        <span style={summarySubStyle}>{datePicker.fromSession === HolidaySession.MORNING ? "Morning" : "Afternoon"}</span>
                                    </div>
                                    <div style={summaryBoxStyle}>
                                        <span style={summaryLabelStyle}>End</span>
                                        <span style={summaryValueStyle}>{fmtDate(datePicker.toDate)}</span>
                                        <span style={summarySubStyle}>{datePicker.toSession === HolidaySession.MORNING ? "Morning" : "Afternoon"}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Duration (from preview) */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ ...labelStyle, marginBottom: 4 }}>Duration</label>
                            <div style={{
                                ...inputStyle,
                                background: "#F8FAFC",
                                color: preview ? "#0F172A" : "#94A3B8",
                                fontWeight: preview ? 600 : 400,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}>
                                {previewLoading
                                    ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #3B82F6", borderTopColor: "transparent", animation: "dh-spin 0.8s linear infinite", display: "inline-block" }} /> Calculating…</>
                                    : preview
                                        ? `${preview.actualLeaveDays} ${preview.actualLeaveDays === 1 ? "Day" : "Days"}`
                                        : "Select dates first"}
                            </div>
                        </div>

                        {/* Reason */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Reason <Req /></label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for leave..."
                                rows={4}
                                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                            />
                        </div>

                        {submitError && (
                            <div style={{ padding: "10px 14px", background: "#FEE2E2", color: "#991B1B", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                                ⚠ {submitError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isValid || submitting || isInsufficient}
                                style={{
                                    ...submitBtnStyle,
                                    background: (!isValid || isInsufficient) ? "#CBD5E1" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                    cursor: (!isValid || isInsufficient) ? "not-allowed" : "pointer",
                                }}
                            >
                                {submitting ? "Submitting…" : "Submit Request →"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Impact Summary */}
                    <div style={{ padding: "24px 28px", background: "#F8FAFC" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 16 }}>
                            Impact Summary
                        </div>

                        {!datePicker.fromDate || !datePicker.toDate || !leaveTypeId ? (
                            <div style={{ background: "white", borderRadius: 16, padding: "32px 24px", textAlign: "center", color: "#94A3B8", border: "2px dashed #E2E8F0" }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>Select leave type and dates<br />to see impact</div>
                            </div>
                        ) : previewLoading ? (
                            <div style={{ background: "white", borderRadius: 16, padding: "40px", display: "flex", justifyContent: "center", border: "1px solid #E2E8F0" }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #3B82F6", borderTopColor: "transparent", animation: "dh-spin 0.8s linear infinite" }} />
                            </div>
                        ) : preview ? (
                            <div style={{ background: hasWarnings ? "#FFFBEB" : "#F0FDF4", borderRadius: 16, padding: "20px 24px", border: `1.5px solid ${hasWarnings ? "#FDE68A" : "#BBF7D0"}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${hasWarnings ? "#FDE68A" : "#BBF7D0"}` }}>
                                    <span style={{ fontSize: 20 }}>📊</span>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>General Information</span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: "#64748B" }}>Actual Leave Days</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                                            {preview.actualLeaveDays.toFixed(1)} Days
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, color: "#64748B" }}>Paid Days</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>{preview.paidDays.toFixed(1)} Days</span>
                                    </div>
                                    <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B" }}>Unpaid Days</span>
                                        <span style={{ fontSize: 26, fontWeight: 800, color: isInsufficient ? "#EF4444" : "#0F172A" }}>
                                            {preview.unpaidDays.toFixed(1)} Days
                                        </span>
                                    </div>
                                </div>

                                <div style={{ background: isInsufficient ? "#FEE2E2" : "white", border: `1.5px solid ${isInsufficient ? "#FCA5A5" : "#10B981"}`, borderRadius: 12, padding: "12px 16px", textAlign: "center", marginBottom: 12 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: isInsufficient ? "#DC2626" : "#059669", marginBottom: 4 }}>
                                        {isInsufficient ? "⚠ Insufficient Balance" : "✓ Valid Request"}
                                    </div>
                                    {!isInsufficient && <div style={{ fontSize: 12, color: "#6B7280" }}>Your request is within the allowable limit.</div>}
                                </div>

                                {preview.warnings.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {preview.warnings.map((w, i) => (
                                            <div key={i} style={{ fontSize: 12, color: "#92400E", background: "#FEF3C7", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 6 }}>
                                                <span>⚠</span><span>{w}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Small helpers ─── */
function Req() {
    return <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>;
}

function fmtDate(ymd: string) {
    if (!ymd) return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
}

/* ─── Style constants ─── */
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", background: "white", boxSizing: "border-box" };
const summaryBoxStyle: React.CSSProperties = { background: "#F8FAFC", borderRadius: 10, padding: "8px 12px", border: "1px solid #E2E8F0" };
const summaryLabelStyle: React.CSSProperties = { display: "block", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#94A3B8", fontWeight: 700 };
const summaryValueStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 };
const summarySubStyle: React.CSSProperties = { display: "block", fontSize: 11, color: "#64748B", marginTop: 1 };
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#475569" };
const submitBtnStyle: React.CSSProperties = { flex: 2, padding: "11px 0", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
