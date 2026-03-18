import { useEffect, useMemo, useState } from "react";
import { policyApi } from "../../../features/policy/api/policyApi";
import type { OTConfig } from "../../../types/policy.types";
import { parseBackendError } from "../../../utils/error.utils";
import "./bod-settings.css";
import { toast } from "../../../components/toast/toast";

export default function BODOTRulesPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<OTConfig | null>(null);
    const [draft, setDraft] = useState<{ maxHoursPerDay: number; maxHoursPerMonth: number; maxHoursPerYear: number }>({
        maxHoursPerDay: 0,
        maxHoursPerMonth: 0,
        maxHoursPerYear: 0,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const active = await policyApi.getActiveOTConfig();
                if (!mounted) return;
                setConfig(active);
                setDraft({
                    maxHoursPerDay: active.maxHoursPerDay,
                    maxHoursPerMonth: active.maxHoursPerMonth,
                    maxHoursPerYear: active.maxHoursPerYear,
                });
            } catch (err: any) {
                if (!mounted) return;
                setError(parseBackendError(err, err.message));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const isDirty = useMemo(() => {
        if (!config) return false;
        return (
            draft.maxHoursPerDay !== config.maxHoursPerDay ||
            draft.maxHoursPerMonth !== config.maxHoursPerMonth ||
            draft.maxHoursPerYear !== config.maxHoursPerYear
        );
    }, [config, draft.maxHoursPerDay, draft.maxHoursPerMonth, draft.maxHoursPerYear]);

    const adjust = (key: "maxHoursPerDay" | "maxHoursPerMonth" | "maxHoursPerYear", delta: number) => {
        setDraft((prev) => {
            const next = Math.max(0, prev[key] + delta);
            return { ...prev, [key]: next };
        });
    };

    const handleCancel = () => {
        if (!config) return;
        setDraft({
            maxHoursPerDay: config.maxHoursPerDay,
            maxHoursPerMonth: config.maxHoursPerMonth,
            maxHoursPerYear: config.maxHoursPerYear,
        });
        setError(null);
    };

    const handleSave = async () => {
        if (!config) return;
        try {
            setSaving(true);
            setError(null);
            await policyApi.updateOTConfig(config.id, {
                maxHoursPerDay: draft.maxHoursPerDay,
                maxHoursPerMonth: draft.maxHoursPerMonth,
                maxHoursPerYear: draft.maxHoursPerYear,
            });
            const refreshed = await policyApi.getActiveOTConfig();
            setConfig(refreshed);
            setDraft({
                maxHoursPerDay: refreshed.maxHoursPerDay,
                maxHoursPerMonth: refreshed.maxHoursPerMonth,
                maxHoursPerYear: refreshed.maxHoursPerYear,
            });
            toast.success("OT rules saved successfully");
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bod-settings-page">
            <div className="bod-settings-header">
                <div className="breadcrumb">
                    <span>Home</span>
                    <span className="separator">/</span>
                    <span>Settings</span>
                    <span className="separator">/</span>
                    <span className="current">OT Rules</span>
                </div>
                <div className="bod-settings-title">Overtime Rules</div>
            </div>

            <div className="bod-settings-card">
                <div className="bod-settings-card-head">
                    <div className="bod-settings-card-icon" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <div className="bod-settings-card-title">Overtime Caps</div>
                        <div className="bod-settings-card-subtitle">Set maximum allowable overtime hours per employee</div>
                    </div>
                </div>

                {loading && <div className="bod-muted">Loading...</div>}
                {!loading && error && <div className="bod-muted" style={{ color: "var(--dh-danger)" }}>{error}</div>}

                {!loading && !error && (
                    <>
                        <div className="bod-stepper-grid">
                            <div className="bod-stepper">
                                <div>
                                    <div className="bod-stepper-label">Max Hours / Day</div>
                                    <div className="bod-stepper-value-row">
                                        <div className="bod-stepper-value">{draft.maxHoursPerDay}</div>
                                        <div className="bod-stepper-unit">Hours</div>
                                    </div>
                                </div>
                                <div className="bod-stepper-actions">
                                    <button
                                        className="bod-stepper-btn"
                                        onClick={() => adjust("maxHoursPerDay", -1)}
                                        disabled={saving || draft.maxHoursPerDay <= 0}
                                        aria-label="Decrease max hours per day"
                                        type="button"
                                    >
                                        –
                                    </button>
                                    <button
                                        className="bod-stepper-btn primary"
                                        onClick={() => adjust("maxHoursPerDay", 1)}
                                        disabled={saving}
                                        aria-label="Increase max hours per day"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="bod-stepper">
                                <div>
                                    <div className="bod-stepper-label">Max Hours / Month</div>
                                    <div className="bod-stepper-value-row">
                                        <div className="bod-stepper-value">{draft.maxHoursPerMonth}</div>
                                        <div className="bod-stepper-unit">Hours</div>
                                    </div>
                                </div>
                                <div className="bod-stepper-actions">
                                    <button
                                        className="bod-stepper-btn"
                                        onClick={() => adjust("maxHoursPerMonth", -1)}
                                        disabled={saving || draft.maxHoursPerMonth <= 0}
                                        aria-label="Decrease max hours per month"
                                        type="button"
                                    >
                                        –
                                    </button>
                                    <button
                                        className="bod-stepper-btn primary"
                                        onClick={() => adjust("maxHoursPerMonth", 1)}
                                        disabled={saving}
                                        aria-label="Increase max hours per month"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="bod-stepper">
                                <div>
                                    <div className="bod-stepper-label">Max Hours / Year</div>
                                    <div className="bod-stepper-value-row">
                                        <div className="bod-stepper-value">{draft.maxHoursPerYear}</div>
                                        <div className="bod-stepper-unit">Hours</div>
                                    </div>
                                </div>
                                <div className="bod-stepper-actions">
                                    <button
                                        className="bod-stepper-btn"
                                        onClick={() => adjust("maxHoursPerYear", -1)}
                                        disabled={saving || draft.maxHoursPerYear <= 0}
                                        aria-label="Decrease max hours per year"
                                        type="button"
                                    >
                                        –
                                    </button>
                                    <button
                                        className="bod-stepper-btn primary"
                                        onClick={() => adjust("maxHoursPerYear", 1)}
                                        disabled={saving}
                                        aria-label="Increase max hours per year"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bod-settings-actions">
                            <button className="bod-btn secondary" onClick={handleCancel} disabled={saving || !isDirty} type="button">
                                Cancel
                            </button>
                            <button className="bod-btn primary" onClick={handleSave} disabled={saving || !isDirty} type="button">
                                Save
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

