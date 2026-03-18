import { useEffect, useRef, useState } from "react";
import { leaveApi } from "../../features/leave/api/leaveApi";
import { leaveTypeApi } from "../../features/leave-type/api/leaveTypeApi";
import { policyApi } from "../../features/policy/api/policyApi";
import { compensationApi } from "../../features/compensation/api/compensationApi";
import type { LeaveType } from "../../types/leave-type.types";
import type { PaidPersonalLeaveEvent } from "../../types/policy.types";
import type { CompensationBalance } from "../../types/compensation.types";
import type {
    CreateLeaveRequestDto,
    PreviewLeaveResponseDto,
} from "../../types/leave.types";
import { HolidaySession, LeaveTypeCode } from "../../types/enum/enum";
import LeaveDatePicker, { type DatePickerValue } from "./LeaveDatePicker";
import { getUserFromStorage } from "../../utils/auth.utils";

interface Props {
    userId: string;
    onClose: () => void;
    onSubmitted: () => void;
}

// Leave types that require evidence upload
const REQUIRES_EVIDENCE: string[] = [LeaveTypeCode.SOCIAL_INSURANCE, LeaveTypeCode.PAID_PERSONAL];

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

    /* ─── CC Email chips state ─── */
    const [ccEmails, setCcEmails] = useState<string[]>([]);              // selected chips
    const [autoEmails, setAutoEmails] = useState<{ email: string; name: string; role: string }[]>([]); // from API (non-removable)
    const [ccInput, setCcInput] = useState("");                          // freetext input
    const ccInputRef = useRef<HTMLInputElement>(null);

    /* ─── File upload state ─── */
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    /* ─── Preview state ─── */
    const [preview, setPreview] = useState<PreviewLeaveResponseDto | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ─── Paid Personal Event state ─── */
    const [paidPersonalEvents, setPaidPersonalEvents] = useState<PaidPersonalLeaveEvent[]>([]);
    const [selectedEventCode, setSelectedEventCode] = useState("");

    /* ─── Compensation balance state ─── */
    const [compensationBalance, setCompensationBalance] = useState<CompensationBalance | null>(null);

    /* ─── Derived ─── */
    const selectedLeaveType = leaveTypes.find((l) => l.id === leaveTypeId);
    const requiresEvidence = selectedLeaveType ? REQUIRES_EVIDENCE.includes(selectedLeaveType.code) : false;
    const isPaidPersonal = selectedLeaveType?.code === LeaveTypeCode.PAID_PERSONAL;
    const isCompensatory = selectedLeaveType?.code === LeaveTypeCode.COMPENSATORY;
    const isSocialInsurance = selectedLeaveType?.code === LeaveTypeCode.SOCIAL_INSURANCE;
    const selectedEvent = paidPersonalEvents.find(e => e.code === selectedEventCode);

    /* ─── Load leave types & leaders ─── */
    useEffect(() => {
        leaveTypeApi.findAll().then((types) => {
            setLeaveTypes(types);
            if (types.length > 0) setLeaveTypeId(types[0].id);
        });

        leaveApi.getNotifyInfo(userId).then(res => {
            if (res?.info) setAutoEmails(res.info);
        }).catch(err => console.error("Failed to load notify info", err));
    }, [userId]);

    /* ─── Fetch compensation balance when type = COMPENSATORY ─── */
    useEffect(() => {
        if (!isCompensatory) {
            setCompensationBalance(null);
            return;
        }
        compensationApi.getBalance(userId)
            .then(setCompensationBalance)
            .catch(() => setCompensationBalance(null));
    }, [isCompensatory, userId]);

    /* ─── Load paid personal events when type changes to PAID_PERSONAL ─── */
    useEffect(() => {
        if (!isPaidPersonal) {
            setSelectedEventCode("");
            return;
        }
        if (paidPersonalEvents.length === 0) {
            policyApi.getAllPaidPersonalEvents().then(events => {
                setPaidPersonalEvents(events);
                if (events.length > 0) setSelectedEventCode(events[0].code);
            }).catch(err => console.error("Failed to load paid personal events", err));
        } else {
            if (paidPersonalEvents.length > 0) setSelectedEventCode(paidPersonalEvents[0].code);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPaidPersonal]);

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
                    leaveTypeCode: selectedLeaveType ? selectedLeaveType.code : "",
                    paidPersonalEventCode: isPaidPersonal && selectedEventCode ? selectedEventCode as any : undefined,
                    fromDate,
                    toDate,
                    fromSession,
                    toSession,
                    emailLeader: ccEmails.length > 0 ? ccEmails.join(",") : undefined,
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
    }, [leaveTypeId, datePicker, selectedEventCode]);

    /* ─── CC Email helpers ─── */
    const addCcEmail = (email: string) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;
        const allExisting = [...autoEmails.map(a => a.email.toLowerCase()), ...ccEmails.map(e => e.toLowerCase())];
        if (allExisting.includes(trimmed)) {
            setCcInput("");
            return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
        setCcEmails(prev => [...prev, trimmed]);
        setCcInput("");
    };

    const removeCcEmail = (email: string) => {
        setCcEmails(prev => prev.filter(e => e !== email));
    };

    const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addCcEmail(ccInput);
        } else if (e.key === "Backspace" && ccInput === "" && ccEmails.length > 0) {
            setCcEmails(prev => prev.slice(0, -1));
        }
    };

    /* ─── File upload helpers ─── */
    const handleFileChange = (file: File | null) => {
        if (!file) return;
        const allowed = ["image/svg+xml", "image/png", "image/jpeg", "application/pdf"];
        if (!allowed.includes(file.type)) return;
        setEvidenceFile(file);
    };

    /* ─── Submit ─── */
    const handleSubmit = async () => {
        const { fromDate, toDate, fromSession, toSession } = datePicker;
        if (!leaveTypeId || !fromDate || !toDate) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const dto: CreateLeaveRequestDto = {
                userId,
                leaveTypeCode: selectedLeaveType?.code || leaveTypeId,
                fromDate,
                toDate,
                fromSession,
                toSession,
                reason: reason || undefined,
                emailLeader: ccEmails.length > 0 ? ccEmails.join(",") : undefined,
                paidPersonalEventCode: isPaidPersonal && selectedEventCode ? selectedEventCode : undefined,
            };
            await leaveApi.create(dto, evidenceFile || undefined);
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

    const isValid = leaveTypeId && datePicker.fromDate && datePicker.toDate;
    const hasWarnings = (preview?.warnings?.length ?? 0) > 0;
    const hasUnpaid = preview && preview.unpaidDays > 0;

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
                    background: "white", borderRadius: 20, width: 920, maxWidth: "95vw",
                    maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
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

                        {/* Sub-Category for Paid Personal Leave */}
                        {isPaidPersonal && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Sub-Category <Req /></label>
                                {paidPersonalEvents.length === 0 ? (
                                    <div style={{ ...inputStyle, background: "#F8FAFC", color: "#94A3B8" }}>Loading…</div>
                                ) : (
                                    <select
                                        value={selectedEventCode}
                                        onChange={(e) => setSelectedEventCode(e.target.value)}
                                        style={inputStyle}
                                    >
                                        {paidPersonalEvents.map((ev) => (
                                            <option key={ev.code} value={ev.code}>
                                                {ev.name} (Max {ev.allowedDays} {ev.allowedDays === 1 ? "day" : "days"})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Date & Shift picker */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Select Leave Period <Req /></label>
                            <LeaveDatePicker userId={userId} value={datePicker} onChange={setDatePicker} />

                            {datePicker.fromDate && datePicker.toDate && (
                                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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

                        {/* Duration */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ ...labelStyle, marginBottom: 4 }}>Duration</label>
                            <div style={{
                                ...inputStyle,
                                background: "#F8FAFC",
                                color: preview ? "#0F172A" : "#94A3B8",
                                fontWeight: preview ? 600 : 400,
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                {previewLoading
                                    ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #3B82F6", borderTopColor: "transparent", animation: "dh-spin 0.8s linear infinite", display: "inline-block" }} /> Calculating…</>
                                    : preview
                                        ? `${preview.actualLeaveDays} ${preview.actualLeaveDays === 1 ? "Day" : "Days"}`
                                        : "Select dates first"}
                            </div>
                            {/* Breakdown hint */}
                            {preview && !previewLoading && preview.weekendDays > 0 && (
                                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>ℹ</span>
                                    <span>Breakdown: {preview.actualLeaveDays + preview.weekendDays + preview.holidayDays} calendar days – {preview.weekendDays} weekend days{preview.holidayDays > 0 ? ` – ${preview.holidayDays} holiday days` : ""} = {preview.actualLeaveDays} valid days</span>
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Reason <Req /></label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for leave..."
                                rows={3}
                                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                            />
                        </div>

                        {/* CC / Notify Others — chips UI */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>CC / Notify Others (@mention)</label>
                            <div
                                style={{
                                    ...inputStyle,
                                    display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
                                    minHeight: 44, height: "auto", cursor: "text", padding: "6px 10px",
                                }}
                                onClick={() => ccInputRef.current?.focus()}
                            >
                                {/* Auto-filled (system) recipients — non-removable */}
                                {autoEmails.map((a) => (
                                    <span key={a.email} style={chipSystemStyle}>
                                        <span style={chipAvatarStyle}>{a.role === "HR" ? "👩‍💼" : "👤"}</span>
                                        <span>{a.name}<span style={{ fontWeight: 400, opacity: 0.75 }}> · {a.email}</span></span>
                                    </span>
                                ))}
                                {/* User-added recipients */}
                                {ccEmails.map((email) => (
                                    <span key={email} style={chipUserStyle}>
                                        {email}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCcEmail(email); }}
                                            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, padding: 0, color: "#6366F1", fontWeight: 700, lineHeight: 1, fontSize: 13 }}
                                        >×</button>
                                    </span>
                                ))}
                                <input
                                    ref={ccInputRef}
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyDown={handleCcKeyDown}
                                    onBlur={() => addCcEmail(ccInput)}
                                    placeholder={autoEmails.length === 0 && ccEmails.length === 0 ? "Add email, press Enter…" : ""}
                                    style={{ border: "none", outline: "none", fontSize: 13, flex: 1, minWidth: 120, background: "transparent", color: "#0F172A" }}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                                System recipients are pre-filled. Type an email and press Enter to add more.
                            </div>
                        </div>

                        {/* Evidence upload — only for certain leave types */}
                        {requiresEvidence && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Evidence</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        const file = e.dataTransfer.files[0];
                                        handleFileChange(file);
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${dragOver ? "#6366F1" : evidenceFile ? "#10B981" : "#CBD5E1"}`,
                                        borderRadius: 12,
                                        padding: "20px 16px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        background: dragOver ? "#F0F0FE" : evidenceFile ? "#F0FDF4" : "#F8FAFC",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {evidenceFile ? (
                                        <div style={{ position: "relative" }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEvidenceFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    top: -8,
                                                    right: -8,
                                                    background: "#EF4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "50%",
                                                    width: 20,
                                                    height: 20,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                    zIndex: 10
                                                }}
                                                title="Remove file"
                                            >
                                                ×
                                            </button>
                                            <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>{evidenceFile.name}</div>
                                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{(evidenceFile.size / 1024).toFixed(0)} KB — click to change</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Click to upload or drag and drop</div>
                                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Supported: SVG, PNG, JPG or PDF</div>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".svg,.png,.jpg,.jpeg,.pdf"
                                    style={{ display: "none" }}
                                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                                />
                            </div>
                        )}

                        {/* Errors */}
                        {submitError && (
                            <div style={{ padding: "10px 14px", background: "#FEE2E2", color: "#991B1B", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                                ⚠ {submitError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isValid || submitting}
                                style={{
                                    ...submitBtnStyle,
                                    background: !isValid ? "#CBD5E1" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                    cursor: !isValid ? "not-allowed" : "pointer",
                                }}
                            >
                                {submitting ? "Submitting…" : "Submit Request →"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Impact Summary / Policy Validation */}
                    <div style={{ padding: "24px 28px", background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* ══ COMPENSATORY LEAVE: Fund Usage Analysis ══ */}
                        {isCompensatory && (
                            <FundUsageAnalysis
                                balance={compensationBalance}
                                preview={preview}
                                previewLoading={previewLoading}
                            />
                        )}

                        {/* ══ SOCIAL INSURANCE: Policy Notice + Fallback Logic ══ */}
                        {isSocialInsurance && (
                            <SocialInsurancePanel />
                        )}

                        {/* ══ OTHER TYPES: Impact Summary (existing logic) ══ */}
                        {!isCompensatory && !isSocialInsurance && (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}>
                                    {isPaidPersonal ? "Policy Validation" : "Impact Summary"}
                                </div>

                                {isPaidPersonal && selectedEvent && (
                                    <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            Policy Entitlement
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 2 }}>
                                            {paidPersonalEvents.map(ev => (
                                                <li key={ev.code} style={{ fontWeight: ev.code === selectedEventCode ? 700 : 400, color: ev.code === selectedEventCode ? "#1D4ED8" : "#374151" }}>
                                                    {ev.name}: Max {ev.allowedDays} {ev.allowedDays === 1 ? "day" : "days"}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

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
                                    <>
                                        {!hasUnpaid && !hasWarnings && (
                                            isPaidPersonal && selectedEvent ? (
                                                <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "20px", border: "1.5px solid #BBF7D0" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                                        <span style={{ fontSize: 22 }}>✅</span>
                                                        <span style={{ fontWeight: 700, fontSize: 15, color: "#059669" }}>Valid Request</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                        <SummaryRow label="Reason" value={selectedEvent.name} color="#0F172A" />
                                                        <SummaryRow label="Policy Allowance" value={`Max ${selectedEvent.allowedDays} Days`} color="#374151" />
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span style={{ fontSize: 12, color: "#64748B" }}>Requesting</span>
                                                            <span style={{ fontSize: 22, fontWeight: 800, color: preview.actualLeaveDays <= selectedEvent.allowedDays ? "#059669" : "#DC2626" }}>
                                                                {preview.actualLeaveDays}.0 Days
                                                            </span>
                                                        </div>
                                                        <div style={{ background: "#D1FAE5", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                                            <div style={{ width: `${Math.min(100, (preview.actualLeaveDays / selectedEvent.allowedDays) * 100)}%`, height: "100%", background: preview.actualLeaveDays <= selectedEvent.allowedDays ? "#10B981" : "#EF4444", borderRadius: 4 }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #BBF7D0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 600 }}>
                                                        <span>✔</span> Within Limit
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "20px", border: "1.5px solid #BBF7D0" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                                        <span style={{ fontSize: 22 }}>✅</span>
                                                        <span style={{ fontWeight: 700, fontSize: 15, color: "#059669" }}>Valid Request</span>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <SummaryRow label="Actual Leave Days" value={`${preview.actualLeaveDays} Days`} color="#0F172A" bold />
                                                        <SummaryRow label="Paid Days" value={`${preview.paidDays} Days`} color="#059669" />
                                                    </div>
                                                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #BBF7D0", fontSize: 12, color: "#6B7280" }}>
                                                        Your request is within the allowable limit.
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {hasUnpaid && (
                                            <div style={{ background: "#FFFBEB", borderRadius: 16, padding: "20px", border: "1.5px solid #FDE68A" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                                    <span style={{ fontSize: 22 }}>⚠️</span>
                                                    <span style={{ fontWeight: 700, fontSize: 15, color: "#92400E" }}>Insufficient Balance</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: "#78350F", marginBottom: 16, lineHeight: 1.6 }}>
                                                    Your request exceeds your available Annual Leave balance. The system will automatically split the request.
                                                </div>
                                                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #FDE68A" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", background: "#FEF3C7", padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                        <span>Breakdown Logic</span>
                                                        <span>Total: {preview.actualLeaveDays} Days</span>
                                                    </div>
                                                    <div style={{ background: "white", padding: "12px 14px", borderBottom: "1px solid #FDE68A" }}>
                                                        <div style={{ display: "flex", gap: 10 }}><span>✅</span><div><div style={{ fontSize: 13, fontWeight: 700 }}>{preview.paidDays} Days – Annual Leave</div><div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Balance fully deducted to 0</div></div></div>
                                                    </div>
                                                    <div style={{ background: "white", padding: "12px 14px" }}>
                                                        <div style={{ display: "flex", gap: 10 }}><span>⚠️</span><div><div style={{ fontSize: 13, fontWeight: 700 }}>{preview.unpaidDays} Days – Unpaid Leave</div><div style={{ fontSize: 12, color: "#D97706", marginTop: 2, fontWeight: 500 }}>Auto-converted (Insufficient Balance)</div></div></div>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: 12, background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#1E40AF", border: "1px solid #BFDBFE", display: "flex", gap: 8 }}>
                                                    <span>ℹ️</span><span><strong>{preview.unpaidDays} days</strong> will be deducted as Leave Without Pay (LWP).</span>
                                                </div>
                                            </div>
                                        )}

                                        {hasWarnings && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                {preview.warnings.map((w, i) => (
                                                    <div key={i} style={{ fontSize: 12, color: "#92400E", background: "#FEF3C7", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 6 }}>
                                                        <span>⚠</span><span>{w}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Fund Usage Analysis panel (Compensatory Leave) ─── */
function FundUsageAnalysis({
    balance,
    preview,
    previewLoading,
}: {
    balance: import("../../types/compensation.types").CompensationBalance | null;
    preview: PreviewLeaveResponseDto | null;
    previewLoading: boolean;
}) {
    const fundHours = balance?.hours ?? 0;
    // 1 day = 8 hours, 0.5 day = 4 hours
    const requestHours = preview ? preview.actualLeaveDays * 8 : null;
    const isValid = requestHours !== null && fundHours >= requestHours;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Card title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Fund Usage Analysis</span>
            </div>

            {/* Breakdown logic table */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                {/* Header */}
                <div style={{
                    background: "#EFF6FF", padding: "10px 16px",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "#1D4ED8",
                }}>
                    Breakdown Logic
                </div>
                {/* From Fund */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8", display: "inline-block" }} />
                        <span style={{ fontSize: 13, color: "#374151" }}>From Fund</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {fundHours.toFixed(1)} Hour{fundHours !== 1 ? "s" : ""}
                    </span>
                </div>
                {/* Total Request */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8", display: "inline-block" }} />
                        <span style={{ fontSize: 13, color: "#374151" }}>Total Request</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {previewLoading
                            ? "…"
                            : requestHours !== null
                                ? `${requestHours.toFixed(1)} Hour${requestHours !== 1 ? "s" : ""}`
                                : "—"}
                    </span>
                </div>
            </div>

            {/* Validity indicator */}
            {!previewLoading && preview && (
                isValid ? (
                    <div style={{
                        background: "#F0FDF4", border: "1.5px solid #BBF7D0",
                        borderRadius: 12, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Valid Request</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>You have sufficient balance for this request</div>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        background: "#FEF2F2", border: "1.5px solid #FECACA",
                        borderRadius: 12, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <span style={{ color: "white", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>!</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Insufficient Balance</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Your fund balance is not enough for this request</div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

/* ─── Social Insurance Policy panel ─── */
function SocialInsurancePanel() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Important Policy Notice */}
            <div style={{
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                borderRadius: 12, padding: "14px 16px",
                display: "flex", gap: 12,
            }}>
                <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#3B82F6", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 6 }}>Important Policy Notice</div>
                    <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.7 }}>
                        Social Insurance leave requests are subject to approval and verification of supporting documents. If your request is rejected or the supporting documents are invalid, the system will apply the fallback logic below.
                    </div>
                </div>
            </div>

            {/* Automatic Fallback Logic */}
            <div style={{
                background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: 12, overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    background: "#FEF3C7", padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Automatic Fallback Logic
                    </span>
                </div>

                {/* Steps */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                        { num: "1", title: "Compensatory Leave", desc: "Applied if you have overtime hours in the current month.", color: "#3B82F6" },
                        { num: "2", title: "Annual Leave", desc: "If compensatory leave is unavailable, annual leave is used.", color: "#F59E0B" },
                        { num: "3", title: "Unpaid Leave", desc: "Salary deduction applies if no balances remain.", color: "#F59E0B" },
                    ].map(step => (
                        <div key={step.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{
                                width: 26, height: 26, borderRadius: "50%",
                                border: `2px solid ${step.color}`, color: step.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                            }}>
                                {step.num}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{step.title}</div>
                                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{step.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #FDE68A", padding: "10px 16px" }}>
                    <p style={{ margin: 0, fontSize: 12, fontStyle: "italic", color: "#D97706" }}>
                        By submitting, you acknowledge that deductions may occur based on this logic.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── Small helpers ─── */
function Req() {
    return <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>;
}

function SummaryRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>{label}</span>
            <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 600, color }}>{value}</span>
        </div>
    );
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
const chipSystemStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
const chipUserStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: 20, padding: "3px 8px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" };
const chipAvatarStyle: React.CSSProperties = { fontSize: 13 };
