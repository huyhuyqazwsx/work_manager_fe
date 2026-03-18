import { useEffect, useMemo, useState } from "react";
import { holidayApi } from "../../../features/holiday/api/holidayApi";
import type { CreateHolidayPayload, Holiday } from "../../../types/holiday.types";
import { HolidaySession, HolidayType } from "../../../types/enum/enum";
import { parseBackendError } from "../../../utils/error.utils";
import "./bod-settings.css";
import { toast } from "../../../components/toast/toast";

const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const fmtShort = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function BODHolidayPage() {
    const today = useMemo(() => new Date(), []);
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Holiday[]>([]);

    const [sideMode, setSideMode] = useState<"none" | "create" | "detail">("none");
    const [detailDate, setDetailDate] = useState<string>("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<{ name: string; session: HolidaySession; type: HolidayType }>({
        name: "",
        session: HolidaySession.FULL,
        type: HolidayType.CUSTOM,
    });

    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isSelectingDates, setIsSelectingDates] = useState(false);
    const [selectedDatesBackup, setSelectedDatesBackup] = useState<string[]>([]);

    const [form, setForm] = useState<{ name: string; session: HolidaySession; type: HolidayType }>({
        name: "",
        session: HolidaySession.FULL,
        type: HolidayType.CUSTOM,
    });

    const monthLabel = `${MONTHS[calMonth]} ${calYear}`;

    const monthHolidays = useMemo(() => {
        const mm = String(calMonth + 1).padStart(2, "0");
        const prefix = `${calYear}-${mm}-`;
        return items
            .filter((h) => h.date.slice(0, 10).startsWith(prefix))
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [items, calMonth, calYear]);

    const holidayMap = useMemo(() => {
        const map: Record<string, Holiday[]> = {};
        items.forEach((h) => {
            const key = h.date.slice(0, 10);
            if (!map[key]) map[key] = [];
            map[key].push(h);
        });
        return map;
    }, [items]);

    const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

    const detailHolidays = useMemo(() => {
        if (!detailDate) return [];
        return (holidayMap[detailDate] ?? []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, [detailDate, holidayMap]);

    const firstDay = useMemo(() => new Date(calYear, calMonth, 1), [calYear, calMonth]);
    const lastDay = useMemo(() => new Date(calYear, calMonth + 1, 0), [calYear, calMonth]);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
    const cells: (Date | null)[] = useMemo(() => {
        const arr: (Date | null)[] = [
            ...Array(startOffset).fill(null),
            ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(calYear, calMonth, i + 1)),
        ];
        while (arr.length % 7 !== 0) arr.push(null);
        return arr;
    }, [calYear, calMonth, lastDay, startOffset]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await holidayApi.findAll({ year: calYear, month: calMonth + 1 });
                if (!mounted) return;
                setItems(data);
                setEditingId(null);
            } catch (err: any) {
                if (!mounted) return;
                const msg = parseBackendError(err, err.message);
                setError(msg);
                toast.error(msg);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [calYear, calMonth]);

    const refreshMonth = async () => {
        const data = await holidayApi.findAll({ year: calYear, month: calMonth + 1 });
        setItems(data);
    };

    const prevMonth = () => {
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear((y) => y - 1);
        } else setCalMonth((m) => m - 1);
        setSideMode("none");
        setDetailDate("");
        setEditingId(null);
    };
    const nextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear((y) => y + 1);
        } else setCalMonth((m) => m + 1);
        setSideMode("none");
        setDetailDate("");
        setEditingId(null);
    };

    const handleDayClick = (ymd: string) => {
        if (isSelectingDates) {
            setSelectedDates((prev) => {
                if (prev.includes(ymd)) return prev.filter((x) => x !== ymd);
                return [...prev, ymd].sort();
            });
            return;
        }

        const hols = holidayMap[ymd] ?? [];
        if (hols.length > 0) {
            setDetailDate(ymd);
            setSideMode("detail");
            setEditingId(null);
        } else if (sideMode === "detail") {
            setDetailDate("");
            setSideMode("none");
            setEditingId(null);
        }
    };

    const applyHoliday = async () => {
        if (selectedDates.length === 0) return;
        if (!form.name.trim()) return;

        try {
            setSaving(true);
            setError(null);
            const payload: CreateHolidayPayload = {
                name: form.name.trim(),
                date: "",
                type: form.type,
                session: form.session,
                isRecurring: false,
            };
            for (const date of selectedDates) {
                await holidayApi.create({ ...payload, date });
            }

            await refreshMonth();
            toast.success(`Holiday created successfully (${selectedDates.length})`);
            setSelectedDates([]);
            setForm((f) => ({ ...f, name: "" }));
            setIsSelectingDates(false);
            setSelectedDatesBackup([]);
            setSideMode("none");
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const clearSelection = () => {
        setSelectedDates([]);
    };

    const startEdit = (h: Holiday) => {
        setEditingId(h.id);
        setEditDraft({
            name: h.name,
            session: h.session,
            type: h.type,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (h: Holiday) => {
        try {
            setSaving(true);
            setError(null);
            await holidayApi.update(h.id, {
                name: editDraft.name.trim(),
                session: editDraft.session,
                type: editDraft.type,
            });
            await refreshMonth();
            setEditingId(null);
            toast.success("Holiday updated successfully");
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const deleteHoliday = async (h: Holiday) => {
        const ok = window.confirm(`Delete holiday "${h.name}" on ${fmtShort(h.date.slice(0, 10))}?`);
        if (!ok) return;
        try {
            setSaving(true);
            setError(null);
            await holidayApi.delete(h.id);
            await refreshMonth();
            setEditingId(null);
            toast.success("Holiday deleted successfully");
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const getCellState = (ymd: string) => {
        const isSelected = selectedSet.has(ymd);
        const hols = holidayMap[ymd] ?? [];
        return { isSelected, hols };
    };

    const canApply = selectedDates.length > 0 && !!form.name.trim() && !saving;

    return (
        <div className="bod-settings-page">
            <div className="bod-settings-header">
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="separator">/</span>
                    <span>Settings</span>
                    <span className="separator">/</span>
                    <span className="current">Holiday</span>
                </div>
                <div className="bod-settings-title">Holiday</div>
            </div>

            {error && <div className="bod-muted" style={{ color: "var(--dh-danger)", marginTop: 10 }}>{error}</div>}

            <div className="bod-holiday-layout">
                {/* Calendar */}
                <div className="bod-holiday-calendar">
                    <div className="bod-holiday-cal-head">
                        <div className="bod-holiday-cal-title">{monthLabel}</div>
                        <div className="bod-holiday-cal-nav">
                            <button className="bod-cal-nav-btn" type="button" onClick={prevMonth} disabled={saving}>
                                ‹
                            </button>
                            <button className="bod-cal-nav-btn" type="button" onClick={nextMonth} disabled={saving}>
                                ›
                            </button>
                        </div>
                    </div>

                    <div className="bod-holiday-cal-grid">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                            <div key={d} className="bod-holiday-cal-dow">{d}</div>
                        ))}

                        {loading && <div className="bod-holiday-cal-loading">Loading holidays…</div>}

                        {cells.map((d, idx) => {
                            if (!d) return <div key={idx} className="bod-holiday-cal-cell empty" />;
                            const ymd = toYMD(d);
                            const isToday = ymd === toYMD(today);
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const { isSelected, hols } = getCellState(ymd);
                            const bg = "transparent";
                            const circleBg = isSelected ? "#1D4ED8" : "transparent";
                            const textColor = isSelected ? "white" : (isWeekend ? "var(--dh-gray-400)" : "var(--dh-gray-900)");
                            const showName = hols[0]?.name;

                            return (
                                <div
                                    key={ymd}
                                    className={`bod-holiday-cal-cell ${isSelectingDates ? "selecting" : "locked"}`}
                                    style={{ background: bg }}
                                    onClick={() => handleDayClick(ymd)}
                                >
                                    <div className="bod-holiday-cal-day">
                                        <span
                                            className="bod-holiday-cal-daynum"
                                            style={{ background: circleBg, color: textColor, fontWeight: isToday || isSelected ? 800 : 600 }}
                                        >
                                            {d.getDate()}
                                        </span>
                                    </div>

                                    {/* holiday dots */}
                                    {hols.length > 0 && (
                                        <div className="bod-holiday-cal-dots">
                                            {(() => {
                                                const first = hols[0];
                                                const dots: string[] = [];
                                                if (first.session === HolidaySession.MORNING || first.session === HolidaySession.FULL) dots.push("#10B981");
                                                if (first.session === HolidaySession.AFTERNOON || first.session === HolidaySession.FULL) dots.push("#FBBF24");
                                                return dots.map((c, i2) => <span key={i2} className="bod-holiday-dot" style={{ background: c }} />);
                                            })()}
                                        </div>
                                    )}

                                    {/* short name */}
                                    {showName && !isSelected && (
                                        <div className="bod-holiday-cal-name">
                                            {showName.length > 10 ? `${showName.slice(0, 9)}…` : showName}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="bod-holiday-legend">
                        <div className="bod-holiday-legend-item"><span className="bod-holiday-dot" style={{ background: "#10B981" }} /> Morning Shift</div>
                        <div className="bod-holiday-legend-item"><span className="bod-holiday-dot" style={{ background: "#FBBF24" }} /> Afternoon Shift</div>
                        <div className="bod-holiday-legend-item"><span className="bod-holiday-dot" style={{ background: "#1D4ED8" }} /> Selected Date</div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="bod-holiday-side">
                    <div className="bod-holiday-panel">
                        <div className="bod-holiday-panel-head">
                            <div className="bod-holiday-panel-title">Holidays in {MONTHS[calMonth]}</div>
                            <button
                                className="bod-holiday-add-btn"
                                type="button"
                                onClick={() => {
                                    setSideMode("create");
                                    setDetailDate("");
                                    setEditingId(null);
                                }}
                                disabled={saving}
                            >
                                + Add Holiday
                            </button>
                        </div>

                        <div className="bod-holiday-list">
                            {monthHolidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="bod-holiday-list-item"
                                    onClick={() => {
                                        const ymd = h.date.slice(0, 10);
                                        setDetailDate(ymd);
                                        setSideMode("detail");
                                        setEditingId(null);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="bod-holiday-list-name">{h.name}</div>
                                    <div className="bod-holiday-list-sub">{fmtShort(h.date.slice(0, 10))}</div>
                                </div>
                            ))}
                            {monthHolidays.length === 0 && (
                                <div className="bod-muted">No holidays in this month.</div>
                            )}
                        </div>
                    </div>

                    {sideMode === "create" && (
                        <div className="bod-holiday-panel">
                            <div className="bod-holiday-panel-head">
                                <div className="bod-holiday-create-title">Create New Holiday</div>
                                <button
                                    type="button"
                                    className="bod-holiday-close-btn"
                                    onClick={() => {
                                        if (isSelectingDates) {
                                            setSelectedDates(selectedDatesBackup);
                                            setIsSelectingDates(false);
                                        }
                                        setSideMode("none");
                                    }}
                                    disabled={saving}
                                    aria-label="Close create holiday"
                                    title="Close"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="bod-muted" style={{ marginTop: 4 }}>Define company-wide events or public holidays for the calendar.</div>

                            <div className="bod-holiday-form">
                                <div className="bod-field">
                                    <label>Holiday Type</label>
                                    <select
                                        className="bod-select"
                                        value={form.type}
                                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HolidayType }))}
                                        disabled={saving}
                                    >
                                        <option value={HolidayType.CUSTOM}>Custom</option>
                                        <option value={HolidayType.FIXED}>Fixed</option>
                                    </select>
                                </div>

                                <div className="bod-field">
                                    <label>Holiday Title</label>
                                    <input
                                        className="bod-input"
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Lunar New Year"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="bod-field">
                                    <label>Selected Dates</label>
                                    <div className="bod-holiday-select-actions">
                                        {!isSelectingDates ? (
                                            <button
                                                type="button"
                                                className="bod-holiday-select-btn"
                                                onClick={() => {
                                                    setSelectedDatesBackup(selectedDates);
                                                    setIsSelectingDates(true);
                                                }}
                                                disabled={saving}
                                            >
                                                Select dates
                                            </button>
                                        ) : (
                                            <div className="bod-holiday-select-actions-row">
                                                <button
                                                    type="button"
                                                    className="bod-holiday-select-btn done"
                                                    onClick={() => setIsSelectingDates(false)}
                                                    disabled={saving}
                                                >
                                                    Done
                                                </button>
                                                <button
                                                    type="button"
                                                    className="bod-holiday-select-btn cancel"
                                                    onClick={() => {
                                                        setSelectedDates(selectedDatesBackup);
                                                        setIsSelectingDates(false);
                                                    }}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bod-holiday-selected">
                                        {selectedDates.length === 0 && (
                                            <div className="bod-muted">
                                                {isSelectingDates ? "Click dates on the calendar to select." : "Click “Select dates” to start selecting on the calendar."}
                                            </div>
                                        )}
                                        {selectedDates.map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                className="bod-holiday-chip"
                                                onClick={() => handleDayClick(d)}
                                                disabled={saving}
                                                title="Click to remove"
                                            >
                                                {fmtShort(d)} <span className="bod-holiday-chip-x">×</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bod-field">
                                    <label>Shift Selection</label>
                                    <div className="bod-holiday-shifts">
                                        <button
                                            type="button"
                                            className={`bod-holiday-shift ${form.session === HolidaySession.MORNING ? "active" : ""}`}
                                            onClick={() => setForm((f) => ({ ...f, session: HolidaySession.MORNING }))}
                                            disabled={saving}
                                        >
                                            <span className="bod-holiday-dot" style={{ background: "#10B981" }} />
                                            Morning Shift
                                        </button>
                                        <button
                                            type="button"
                                            className={`bod-holiday-shift ${form.session === HolidaySession.AFTERNOON ? "active" : ""}`}
                                            onClick={() => setForm((f) => ({ ...f, session: HolidaySession.AFTERNOON }))}
                                            disabled={saving}
                                        >
                                            <span className="bod-holiday-dot" style={{ background: "#FBBF24" }} />
                                            Afternoon Shift
                                        </button>
                                        <button
                                            type="button"
                                            className={`bod-holiday-shift ${form.session === HolidaySession.FULL ? "active" : ""}`}
                                            onClick={() => setForm((f) => ({ ...f, session: HolidaySession.FULL }))}
                                            disabled={saving}
                                        >
                                            <span className="bod-holiday-dot" style={{ background: "#10B981" }} />
                                            <span className="bod-holiday-dot" style={{ background: "#FBBF24" }} />
                                            Full Day
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="bod-holiday-apply-btn"
                                    type="button"
                                    onClick={applyHoliday}
                                    disabled={!canApply}
                                >
                                    Apply to Calendar ({selectedDates.length})
                                </button>

                                <button className="bod-holiday-clear-btn" type="button" onClick={clearSelection} disabled={saving}>
                                    Clear Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {sideMode === "detail" && detailDate && (
                        <div className="bod-holiday-panel">
                            <div className="bod-holiday-panel-head">
                                <div className="bod-holiday-create-title">Holiday Details</div>
                                <button
                                    type="button"
                                    className="bod-holiday-close-btn"
                                    onClick={() => { setDetailDate(""); setSideMode("none"); }}
                                    disabled={saving}
                                    aria-label="Close holiday details"
                                    title="Close"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="bod-muted" style={{ marginTop: 4 }}>{fmtShort(detailDate)}</div>

                            <div className="bod-holiday-detail-list">
                                {detailHolidays.map((h) => (
                                    <div key={h.id} className="bod-holiday-detail-item">
                                        {editingId === h.id ? (
                                            <div className="bod-holiday-detail-edit">
                                                <div className="bod-field">
                                                    <label>Title</label>
                                                    <input
                                                        className="bod-input"
                                                        value={editDraft.name}
                                                        onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                                                        disabled={saving}
                                                    />
                                                </div>

                                                <div className="bod-field">
                                                    <label>Type</label>
                                                    <select
                                                        className="bod-select"
                                                        value={editDraft.type}
                                                        onChange={(e) => setEditDraft((p) => ({ ...p, type: e.target.value as HolidayType }))}
                                                        disabled={saving}
                                                    >
                                                        <option value={HolidayType.CUSTOM}>Custom</option>
                                                        <option value={HolidayType.FIXED}>Fixed</option>
                                                    </select>
                                                </div>

                                                <div className="bod-field">
                                                    <label>Session</label>
                                                    <select
                                                        className="bod-select"
                                                        value={editDraft.session}
                                                        onChange={(e) => setEditDraft((p) => ({ ...p, session: e.target.value as HolidaySession }))}
                                                        disabled={saving}
                                                    >
                                                        <option value={HolidaySession.MORNING}>Morning</option>
                                                        <option value={HolidaySession.AFTERNOON}>Afternoon</option>
                                                        <option value={HolidaySession.FULL}>Full</option>
                                                    </select>
                                                </div>

                                                <div className="bod-holiday-detail-actions">
                                                    <button type="button" className="bod-mini-btn" onClick={cancelEdit} disabled={saving}>
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bod-mini-btn primary"
                                                        onClick={() => saveEdit(h)}
                                                        disabled={saving || !editDraft.name.trim()}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bod-holiday-detail-row">
                                                    <div className="bod-holiday-detail-name">{h.name}</div>
                                                    <div className="bod-holiday-detail-row-actions">
                                                        <button
                                                            type="button"
                                                            className="bod-mini-icon-btn"
                                                            onClick={() => startEdit(h)}
                                                            disabled={saving}
                                                            title="Edit"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="bod-mini-icon-btn danger"
                                                            onClick={() => deleteHoliday(h)}
                                                            disabled={saving}
                                                            title="Delete"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="bod-holiday-detail-meta">
                                                    <span className="bod-holiday-detail-pill">{h.session}</span>
                                                    <span className="bod-holiday-detail-pill">{h.type}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {detailHolidays.length === 0 && (
                                    <div className="bod-muted">No holiday details for this day.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

