import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { holidayApi } from "../../../features/holiday/api/holidayApi";
import type { Holiday } from "../../../types/holiday.types";
import { HolidaySession } from "../../../types/enum/enum";

/* ─── Types ─── */
export interface DatePickerValue {
    fromDate: string;
    toDate: string;
    fromSession: HolidaySession;
    toSession: HolidaySession;
}

interface Props {
    value: DatePickerValue;
    onChange: (v: DatePickerValue) => void;
}

/* ─── Helpers ─── */
const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ymdToDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const SESSION_LABELS: Record<HolidaySession, { label: string; sub: string }> = {
    [HolidaySession.MORNING]: { label: "Morning", sub: "08:00 – 12:00" },
    [HolidaySession.AFTERNOON]: { label: "Afternoon", sub: "13:00 – 17:30" },
    [HolidaySession.FULL]: { label: "Full Day", sub: "08:00 – 17:30" },
};

const navBtnStyle: React.CSSProperties = {
    background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
    width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#374151",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            {label}
        </div>
    );
}

/* ─── Component ─── */
export default function LeaveDatePicker({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [picking, setPicking] = useState<"start" | "end">("start");
    const [hoverDate, setHoverDate] = useState<string | null>(null);
    const [draft, setDraft] = useState<DatePickerValue>({ ...value });
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [tooltip, setTooltip] = useState<{ date: string; holidays: Holiday[] } | null>(null);

    /* Auto-correct shift if same day and invalid order */
    useEffect(() => {
        const order = { [HolidaySession.MORNING]: 0, [HolidaySession.FULL]: 1, [HolidaySession.AFTERNOON]: 2 };
        if (draft.fromDate && draft.toDate && draft.fromDate === draft.toDate) {
            if (order[draft.fromSession] > order[draft.toSession]) {
                setDraft((d) => ({ ...d, toSession: d.fromSession }));
            }
        }
    }, [draft.fromDate, draft.toDate, draft.fromSession, draft.toSession]);

    /* sync draft when closed */
    useEffect(() => { if (!open) setDraft({ ...value }); }, [open, value]);

    /* fetch holidays for visible months */
    useEffect(() => {
        if (!open) return;
        const months = [-1, 0, 1].map((offset) => {
            const d = new Date(calYear, calMonth + offset, 1);
            return { year: d.getFullYear(), month: d.getMonth() + 1 };
        });
        Promise.all(months.map(({ year, month }) =>
            holidayApi.findAll({ year, month }).catch(() => [] as Holiday[])
        )).then((results) => {
            const all = results.flat();
            setHolidays((prev) => {
                const map = new Map(prev.map((h) => [h.id, h]));
                all.forEach((h) => map.set(h.id, h));
                return Array.from(map.values());
            });
        });
    }, [open, calYear, calMonth]);

    /* calendar grid */
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(calYear, calMonth, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    /* holiday lookup */
    const holidayMap: Record<string, Holiday[]> = {};
    holidays.forEach((h) => {
        const key = h.date.slice(0, 10);
        if (!holidayMap[key]) holidayMap[key] = [];
        holidayMap[key].push(h);
    });

    /* range */
    const effectiveEnd = draft.toDate || hoverDate || draft.fromDate;
    const rangeStart = draft.fromDate && effectiveEnd ? [draft.fromDate, effectiveEnd].sort()[0] : draft.fromDate;
    const rangeEnd = draft.fromDate && effectiveEnd ? [draft.fromDate, effectiveEnd].sort()[1] : effectiveEnd;

    const getState = (ymd: string, d: Date) => ({
        isWeekend: d.getDay() === 6 || d.getDay() === 0,
        isHoliday: !!holidayMap[ymd],
        isStart: ymd === draft.fromDate,
        isEnd: ymd === draft.toDate,
        isInRange: !!(rangeStart && rangeEnd && ymd > rangeStart && ymd < rangeEnd),
        isRangeEdge: ymd === draft.fromDate || ymd === draft.toDate,
    });

    const handleDayClick = (ymd: string) => {
        if (picking === "start") {
            if (draft.toDate && ymd > draft.toDate) {
                setDraft((d) => ({ ...d, fromDate: ymd, toDate: "" }));
            } else {
                setDraft((d) => ({ ...d, fromDate: ymd }));
            }
            setPicking("end");
        } else {
            if (draft.fromDate && ymd < draft.fromDate) {
                setDraft((d) => ({ ...d, fromDate: ymd, toDate: "" }));
            } else {
                setDraft((d) => ({ ...d, toDate: ymd }));
            }
        }
    };

    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };

    const handleApply = () => {
        if (!draft.fromDate || !draft.toDate) return;
        onChange(draft);
        setOpen(false);
    };

    const fmt = (ymd: string) =>
        ymd ? ymdToDate(ymd).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

    const hasSelection = !!value.fromDate && !!value.toDate;

    /* ─── Render ─── */
    return (
        <div style={{ position: "relative", width: "100%" }}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                    background: hasSelection ? "#EFF6FF" : "#F8FAFC",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    fontSize: 14, fontWeight: hasSelection ? 600 : 400,
                    color: hasSelection ? "#1D4ED8" : "#94A3B8", textAlign: "left",
                }}
            >
                <span style={{ fontSize: 16 }}>📅</span>
                {hasSelection ? `${fmt(value.fromDate)}  →  ${fmt(value.toDate)}` : "Select Date & Shifts"}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}>›</span>
            </button>

            {/* Centered modal portal */}
            {open && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div
                        ref={popupRef}
                        style={{
                            background: "white", borderRadius: 20,
                            boxShadow: "0 20px 64px rgba(0,0,0,0.25)",
                            width: 420, maxWidth: "95vw",
                            padding: "24px 24px 20px",
                            border: "1px solid #E2E8F0",
                        }}
                    >
                        {/* Selected range header */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            {(["START", "END"] as const).map((label, i) => {
                                const date = i === 0 ? draft.fromDate : draft.toDate;
                                const active = (i === 0 && picking === "start") || (i === 1 && picking === "end");
                                return (
                                    <div
                                        key={label}
                                        onClick={() => setPicking(i === 0 ? "start" : "end")}
                                        style={{
                                            flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                                            border: `1.5px solid ${active ? "#3B82F6" : "#E2E8F0"}`,
                                            background: active ? "#EFF6FF" : "white",
                                        }}
                                    >
                                        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>{label}</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                                            {date ? fmt(date) : <span style={{ color: "#CBD5E1", fontWeight: 400 }}>—</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => { setDraft((d) => ({ ...d, fromDate: "", toDate: "" })); setPicking("start"); }}
                                style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, cursor: "pointer", color: "#64748B", fontSize: 16, alignSelf: "center" }}
                            >×</button>
                        </div>

                        {/* Month nav */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{MONTHS[calMonth]} {calYear}</span>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" onClick={prevMonth} style={navBtnStyle}>‹</button>
                                <button type="button" onClick={nextMonth} style={navBtnStyle}>›</button>
                            </div>
                        </div>

                        {/* Day headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8", padding: "4px 0" }}>{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                            {cells.map((d, i) => {
                                if (!d) return <div key={i} />;
                                const ymd = toYMD(d);
                                const { isWeekend, isHoliday, isStart, isEnd, isInRange } = getState(ymd, d);
                                const isToday = ymd === toYMD(today);
                                const isOtherMonth = d.getMonth() !== calMonth;
                                const isRangeEdge = isStart || isEnd;
                                const isRangeSingle = isStart && isEnd;

                                // Colors based on reference image
                                const rangeBg = "#DCE7FB"; // Light blue for the range bar
                                const circleBg = "#1D4ED8"; // Deep blue for the selected circle

                                const bg = isRangeSingle ? "transparent" : isInRange || isRangeEdge ? rangeBg : "transparent";
                                const col = isRangeEdge ? "white"
                                    : isWeekend ? "#94A3B8"
                                        : isOtherMonth ? "#CBD5E1"
                                            : "#0F172A";

                                return (
                                    <div
                                        key={ymd}
                                        onClick={() => handleDayClick(ymd)}
                                        onMouseEnter={() => { setHoverDate(ymd); if (isHoliday) setTooltip({ date: ymd, holidays: holidayMap[ymd] }); }}
                                        onMouseLeave={() => { setHoverDate(null); setTooltip(null); }}
                                        style={{
                                            position: "relative", textAlign: "center", padding: "6px 0",
                                            background: bg, cursor: "pointer", userSelect: "none",
                                            borderRadius: isRangeSingle ? 0 : 0,
                                            borderTopLeftRadius: (isStart || (isInRange && d.getDay() === 1)) ? 20 : 0,
                                            borderBottomLeftRadius: (isStart || (isInRange && d.getDay() === 1)) ? 20 : 0,
                                            borderTopRightRadius: (isEnd || (isInRange && d.getDay() === 0)) ? 20 : 0,
                                            borderBottomRightRadius: (isEnd || (isInRange && d.getDay() === 0)) ? 20 : 0,
                                        }}
                                    >
                                        <div style={{
                                            display: "flex", justifyContent: "center", alignItems: "center",
                                            position: "relative", zIndex: 1,
                                        }}>
                                            <span style={{
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: isRangeEdge ? circleBg : "transparent",
                                                fontSize: 14, fontWeight: isRangeEdge || isToday ? 700 : 400,
                                                color: col,
                                            }}>
                                                {d.getDate()}
                                            </span>
                                        </div>

                                        {/* Today dot */}
                                        {isToday && !isRangeEdge && (
                                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#3B82F6", margin: "2px auto 0" }} />
                                        )}

                                        {/* Holiday dots */}
                                        {isHoliday && !isRangeEdge && (
                                            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4 }}>
                                                {holidayMap[ymd].slice(0, 1).map((h, idx) => {
                                                    const dots = [];
                                                    if (h.session === HolidaySession.MORNING || h.session === HolidaySession.FULL) dots.push("#10B981");
                                                    if (h.session === HolidaySession.AFTERNOON || h.session === HolidaySession.FULL) dots.push("#FBBF24");
                                                    return dots.map((color, dIdx) => (
                                                        <div key={`${idx}-${dIdx}`} style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
                                                    ));
                                                })}
                                            </div>
                                        )}
                                        {isHoliday && isRangeEdge && (
                                            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
                                            </div>
                                        )}

                                        {/* Holiday short name */}
                                        {isHoliday && !isRangeEdge && holidayMap[ymd][0] && (
                                            <div style={{ fontSize: 9, color: "#EF4444", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, marginTop: 1 }}>
                                                {holidayMap[ymd][0].name.length > 8 ? holidayMap[ymd][0].name.slice(0, 7) + "…" : holidayMap[ymd][0].name}
                                            </div>
                                        )}

                                        {/* Hover tooltip */}
                                        {tooltip?.date === ymd && (
                                            <div style={{
                                                position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                                                transform: "translateX(-50%)", background: "#1E293B", color: "white",
                                                borderRadius: 8, padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap",
                                                zIndex: 10001, pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                            }}>
                                                {tooltip.holidays.map((h, idx) => (
                                                    <div key={idx} style={{ lineHeight: 1.6 }}>
                                                        <span style={{ color: h.session === HolidaySession.AFTERNOON ? "#FBBF24" : "#10B981" }}>●</span>{" "}
                                                        {h.name} ({h.session})
                                                    </div>
                                                ))}
                                                <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 8, height: 8, background: "#1E293B" }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Shift selection */}
                        <div style={{ marginTop: 16, borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
                            {(["fromSession", "toSession"] as const).map((field, i) => (
                                <div key={field} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i === 0 ? 10 : 0 }}>
                                    <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500, width: 72, flexShrink: 0 }}>
                                        {i === 0 ? "Start Shift" : "End Shift"}
                                    </span>
                                    <div style={{ display: "flex", gap: 8, flex: 1 }}>
                                        {[HolidaySession.MORNING, HolidaySession.AFTERNOON].map((s) => {
                                            const active = draft[field] === s;
                                            const info = SESSION_LABELS[s];
                                            const isSameDay = draft.fromDate && draft.toDate && draft.fromDate === draft.toDate;
                                            const isDisabled = isSameDay && (
                                                (field === "fromSession" && s === HolidaySession.AFTERNOON && draft.toSession === HolidaySession.MORNING) ||
                                                (field === "toSession" && s === HolidaySession.MORNING && draft.fromSession === HolidaySession.AFTERNOON)
                                            );
                                            return (
                                                <button
                                                    key={s} type="button"
                                                    disabled={!!isDisabled}
                                                    onClick={() => setDraft((d) => ({ ...d, [field]: s }))}
                                                    style={{
                                                        flex: 1, padding: "8px 6px", borderRadius: 10, cursor: isDisabled ? "not-allowed" : "pointer", textAlign: "center",
                                                        border: `1.5px solid ${active ? "#3B82F6" : isDisabled ? "#E2E8F0" : "#E2E8F0"}`,
                                                        background: active ? "#1D4ED8" : isDisabled ? "#F8FAFC" : "white",
                                                        opacity: isDisabled ? 0.5 : 1,
                                                    }}
                                                >
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? "white" : isDisabled ? "#94A3B8" : "#374151" }}>{info.label}</div>
                                                    <div style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.75)" : "#94A3B8", marginTop: 2 }}>({info.sub})</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: 12, display: "flex", gap: 14, fontSize: 11, color: "#64748B" }}>
                            <LegendDot color="#10B981" label="Morning Off" />
                            <LegendDot color="#FBBF24" label="Afternoon Off" />
                            <LegendDot color="#3B82F6" label="Today" />
                        </div>

                        {/* Apply / Cancel */}
                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                            <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                                Cancel
                            </button>
                            <button
                                type="button" onClick={handleApply}
                                disabled={!draft.fromDate || !draft.toDate}
                                style={{
                                    flex: 2, padding: "9px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, color: "white",
                                    background: (!draft.fromDate || !draft.toDate) ? "#CBD5E1" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                    cursor: (!draft.fromDate || !draft.toDate) ? "not-allowed" : "pointer",
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
