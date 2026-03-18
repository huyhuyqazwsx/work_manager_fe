import { useState, useRef, useEffect } from "react";

export interface DateRangeTimeValue {
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
}

interface DotInfo {
    color: string;
    label?: string;
}

interface Props {
    value: DateRangeTimeValue;
    onChange: (v: DateRangeTimeValue) => void;
    dotDates?: Record<string, DotInfo[]>;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function fmtDisplay(ymd: string) {
    if (!ymd) return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

/* ─── Time scroll column ─── */
function TimeColumn({ values, selected, fmt, onSelect, isDisabled }: {
    values: number[];
    selected: number;
    fmt: (v: number) => string;
    onSelect: (v: number) => void;
    isDisabled?: (v: number) => boolean;
}) {
    const listRef = useRef<HTMLDivElement>(null);
    const ITEM_H = 32;

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const idx = values.indexOf(selected);
        el.scrollTop = idx * ITEM_H - ITEM_H * 2;
    }, [selected, values]);

    return (
        <div
            ref={listRef}
            style={{
                flex: 1, height: 160, overflowY: "auto", borderRadius: 8,
                scrollbarWidth: "none", msOverflowStyle: "none" as never,
            }}
        >
            {values.map(v => {
                const active = v === selected;
                const disabled = isDisabled?.(v) ?? false;
                return (
                    <div
                        key={v}
                        onClick={() => !disabled && onSelect(v)}
                        style={{
                            height: ITEM_H, display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 14,
                            cursor: disabled ? "not-allowed" : "pointer",
                            fontWeight: active ? 700 : 400, borderRadius: 6,
                            background: active ? "#1E3A8A" : "transparent",
                            color: active ? "white" : disabled ? "#CBD5E1" : "#374151",
                            opacity: disabled ? 0.4 : 1,
                            transition: "background 0.1s",
                        }}
                    >
                        {fmt(v)}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main component ─── */
export default function DateRangeTimePicker({ value, onChange, dotDates }: Props) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRangeTimeValue>(value);
    const [step, setStep] = useState<"start" | "end">("start");
    const [hover, setHover] = useState("");
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const triggerRef = useRef<HTMLDivElement>(null);

    /* Sync draft on open */
    useEffect(() => {
        if (open) {
            setDraft(value);
            setStep("start");
            setHover("");
            if (value.startDate) {
                const [y, m] = value.startDate.split("-").map(Number);
                setViewYear(y);
                setViewMonth(m - 1);
            }
        }
    }, [open]);

    /* Build calendar cells (Mon-first) */
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon = 0
    const cells: (number | null)[] = [
        ...Array(startDow).fill(null),
        ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const toDateStr = (day: number) =>
        `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;

    const handleDayClick = (day: number) => {
        const ds = toDateStr(day);
        if (ds < todayStr) return; // block past dates
        if (step === "start") {
            setDraft(d => ({ ...d, startDate: ds, endDate: "" }));
            setStep("end");
        } else {
            // free range: smaller = start, larger = end
            const [s, e] = ds < draft.startDate ? [ds, draft.startDate] : [draft.startDate, ds];
            setDraft(d => ({ ...d, startDate: s, endDate: e }));
            setStep("start");
        }
    };

    const toMin = (h: number, m: number) => h * 60 + m;
    const isSameDay = !!(draft.startDate && draft.endDate && draft.startDate === draft.endDate);

    const effectiveEnd = step === "end" ? (hover || draft.endDate) : draft.endDate;

    const isStart = (ds: string) => ds === draft.startDate;
    const isEnd = (ds: string) => ds === effectiveEnd && effectiveEnd !== draft.startDate;
    const isInRange = (ds: string) => {
        const s = draft.startDate;
        const e = effectiveEnd;
        if (!s || !e) return false;
        const [lo, hi] = s <= e ? [s, e] : [e, s];
        return ds > lo && ds < hi;
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const startH = parseInt(draft.startTime?.split(":")[0] ?? "18");
    const startM = parseInt(draft.startTime?.split(":")[1] ?? "0");
    const endH = parseInt(draft.endTime?.split(":")[0] ?? "21");
    const endM = parseInt(draft.endTime?.split(":")[1] ?? "0");

    const handleConfirm = () => {
        onChange(draft);
        setOpen(false);
    };

    const handleClear = () => {
        const cleared = { startDate: "", endDate: "", startTime: draft.startTime, endTime: draft.endTime };
        setDraft(cleared);
        setStep("start");
    };

    /* Trigger display */
    const triggerText = value.startDate
        ? `${fmtDisplay(value.startDate)} → ${value.endDate ? fmtDisplay(value.endDate) : "?"}`
        : "Select dates";

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            {/* Trigger */}
            <div
                ref={triggerRef}
                onClick={() => setOpen(o => !o)}
                style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 8,
                    border: `1.5px solid ${open ? "#3B82F6" : "var(--dh-gray-200, #E2E8F0)"}`,
                    background: "white", cursor: "pointer", minWidth: 180,
                    boxShadow: open ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
                    transition: "all 0.15s", userSelect: "none",
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span style={{ fontSize: 13, color: value.startDate ? "#0F172A" : "#94A3B8", fontWeight: value.startDate ? 600 : 400, flex: 1 }}>
                    {triggerText}
                </span>
            </div>

            {/* Modal overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 9998,
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(2px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: "white",
                        borderRadius: 16,
                        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
                        display: "flex",
                        width: 680,
                        overflow: "hidden",
                    }}
                >
                    {/* ── Left: Calendar ── */}
                    <div style={{ flex: 1, padding: "24px 20px" }}>
                        {/* Start / End display + clear */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                            <div style={{
                                flex: 1, borderRadius: 10, padding: "10px 14px",
                                border: `2px solid ${step === "start" ? "#3B82F6" : "#E2E8F0"}`,
                                cursor: "pointer",
                            }} onClick={() => setStep("start")}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#94A3B8", marginBottom: 4 }}>START</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: draft.startDate ? "#0F172A" : "#CBD5E1" }}>
                                    {draft.startDate ? fmtDisplay(draft.startDate) : "—"}
                                </div>
                            </div>
                            <div style={{
                                flex: 1, borderRadius: 10, padding: "10px 14px",
                                border: `2px solid ${step === "end" ? "#3B82F6" : "#E2E8F0"}`,
                                cursor: "pointer",
                            }} onClick={() => draft.startDate && setStep("end")}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#94A3B8", marginBottom: 4 }}>END</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: draft.endDate ? "#0F172A" : "#CBD5E1" }}>
                                    {draft.endDate ? fmtDisplay(draft.endDate) : "—"}
                                </div>
                            </div>
                            <button
                                onClick={handleClear}
                                style={{
                                    alignSelf: "center", width: 30, height: 30, border: "none",
                                    background: "#F1F5F9", borderRadius: "50%", cursor: "pointer",
                                    fontSize: 18, color: "#64748B", display: "flex",
                                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}
                            >×</button>
                        </div>

                        {/* Month navigation */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </h3>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={prevMonth} style={navBtnStyle}>‹</button>
                                <button onClick={nextMonth} style={navBtnStyle}>›</button>
                            </div>
                        </div>

                        {/* Day-of-week headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                            {DOW_LABELS.map((d, i) => (
                                <div key={d} style={{
                                    textAlign: "center", fontSize: 11, fontWeight: 700, padding: "4px 0",
                                    color: i >= 5 ? "#CBD5E1" : "#94A3B8",
                                }}>{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                            {cells.map((day, i) => {
                                if (!day) return <div key={i} style={{ height: 40 }} />;
                                const ds = toDateStr(day);
                                const isSt = isStart(ds);
                                const isEn = isEnd(ds);
                                const inRange = isInRange(ds);
                                const isWeekend = i % 7 >= 5;
                                const isPast = ds < todayStr;
                                const isToday = ds === todayStr;
                                const isBlocked = isPast;
                                const dots = dotDates?.[ds] ?? [];

                                let bg = "transparent";
                                let circleBg = "transparent";
                                let color = isBlocked ? "#CBD5E1" : isWeekend ? "#94A3B8" : "#0F172A";
                                let borderRadius = "6px";
                                if (!isBlocked && (isSt || isEn)) { bg = "#DBEAFE"; circleBg = "#1E3A8A"; color = "white"; borderRadius = isSt ? "20px 0 0 20px" : "0 20px 20px 0"; }
                                else if (!isBlocked && inRange) { bg = "#DBEAFE"; borderRadius = "0"; }
                                if (isSt && isEn) { borderRadius = "20px"; }

                                return (
                                    <div
                                        key={i}
                                        onMouseEnter={() => !isBlocked && step === "end" && setHover(ds)}
                                        onMouseLeave={() => setHover("")}
                                        onClick={() => handleDayClick(day)}
                                        style={{
                                            height: 40, cursor: isBlocked ? "not-allowed" : "pointer", borderRadius,
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", justifyContent: "center",
                                            background: bg, position: "relative",
                                            transition: "background 0.1s",
                                            opacity: isBlocked ? 0.5 : 1,
                                        }}
                                    >
                                        <span style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            width: 32, height: 32, borderRadius: "50%",
                                            background: circleBg,
                                            border: isToday && !isSt && !isEn ? "2px solid #3B82F6" : "none",
                                            fontSize: 13, fontWeight: isSt || isEn || isToday ? 700 : 400,
                                            color, lineHeight: "1",
                                        }}>
                                            {day}
                                        </span>

                                        {/* Dots */}
                                        {dots.length > 0 && (
                                            <>
                                                <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 4 }}>
                                                    {dots.slice(0, 3).map((dot, di) => (
                                                        <span key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: dot.color, display: "block" }} />
                                                    ))}
                                                </div>
                                                {dots[0].label && (
                                                    <span style={{
                                                        position: "absolute", top: "100%", left: "50%",
                                                        transform: "translateX(-50%)",
                                                        fontSize: 9, color: dots[0].color, whiteSpace: "nowrap",
                                                        pointerEvents: "none", zIndex: 2,
                                                    }}>
                                                        {dots[0].label}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: Time pickers ── */}
                    <div style={{
                        width: 196, borderLeft: "1px solid #F1F5F9",
                        padding: "24px 14px", display: "flex",
                        flexDirection: "column", gap: 16,
                    }}>
                        {/* START TIME */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#94A3B8" }}>START TIME</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <TimeColumn
                                    values={HOURS}
                                    selected={startH}
                                    fmt={v => String(v)}
                                    onSelect={h => setDraft(d => ({ ...d, startTime: `${pad(h)}:${pad(startM)}` }))}
                                    isDisabled={isSameDay ? (h => toMin(h, startM) >= toMin(endH, endM)) : undefined}
                                />
                                <TimeColumn
                                    values={MINUTES}
                                    selected={startM}
                                    fmt={v => pad(v)}
                                    onSelect={m => setDraft(d => ({ ...d, startTime: `${pad(startH)}:${pad(m)}` }))}
                                    isDisabled={isSameDay ? (m => toMin(startH, m) >= toMin(endH, endM)) : undefined}
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: "1px solid #F1F5F9" }} />

                        {/* END TIME */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#94A3B8" }}>END TIME</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <TimeColumn
                                    values={HOURS}
                                    selected={endH}
                                    fmt={v => String(v)}
                                    onSelect={h => setDraft(d => ({ ...d, endTime: `${pad(h)}:${pad(endM)}` }))}
                                    isDisabled={isSameDay ? (h => toMin(h, endM) <= toMin(startH, startM)) : undefined}
                                />
                                <TimeColumn
                                    values={MINUTES}
                                    selected={endM}
                                    fmt={v => pad(v)}
                                    onSelect={m => setDraft(d => ({ ...d, endTime: `${pad(endH)}:${pad(m)}` }))}
                                    isDisabled={isSameDay ? (m => toMin(endH, m) <= toMin(startH, startM)) : undefined}
                                />
                            </div>
                        </div>

                        {/* Confirm */}
                        <button
                            onClick={handleConfirm}
                            disabled={!draft.startDate || !draft.endDate}
                            style={{
                                marginTop: "auto", padding: "10px 0", borderRadius: 8, border: "none",
                                background: draft.startDate && draft.endDate ? "#1E3A8A" : "#CBD5E1",
                                color: "white", fontWeight: 700, fontSize: 13,
                                cursor: draft.startDate && draft.endDate ? "pointer" : "not-allowed",
                                transition: "background 0.15s",
                            }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}

const navBtnStyle: React.CSSProperties = {
    border: "1px solid #E2E8F0", background: "white", borderRadius: 6,
    width: 28, height: 28, cursor: "pointer", fontSize: 16,
    color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center",
};
