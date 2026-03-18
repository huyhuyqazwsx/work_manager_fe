import { useEffect, useMemo, useState } from "react";
import { policyApi } from "../../../features/policy/api/policyApi";
import type { LeaveConfig } from "../../../types/policy.types";
import { parseBackendError } from "../../../utils/error.utils";
import "./bod-settings.css";
import { toast } from "../../../components/toast/toast";

type LeaveDraft = Pick<LeaveConfig, "baseDaysPerYear" | "bonusYearCycle" | "bonusDaysPerCycle" | "joinDateCutoffDay">;

export default function BODLeavePolicyPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<LeaveConfig | null>(null);
    const [draft, setDraft] = useState<LeaveDraft>({
        baseDaysPerYear: 0,
        bonusYearCycle: 0,
        bonusDaysPerCycle: 0,
        joinDateCutoffDay: 1,
    });

    const selectedConfig = config;

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const all = await policyApi.getAllLeaveConfigs();
                if (!mounted) return;
                const active = all.find((c) => c.isActive) ?? all[0] ?? null;
                if (!active) {
                    setConfig(null);
                    return;
                }
                setConfig(active);
                setDraft({
                    baseDaysPerYear: active.baseDaysPerYear,
                    bonusYearCycle: active.bonusYearCycle,
                    bonusDaysPerCycle: active.bonusDaysPerCycle,
                    joinDateCutoffDay: active.joinDateCutoffDay,
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
        if (!selectedConfig) return false;
        return (
            draft.baseDaysPerYear !== selectedConfig.baseDaysPerYear ||
            draft.bonusYearCycle !== selectedConfig.bonusYearCycle ||
            draft.bonusDaysPerCycle !== selectedConfig.bonusDaysPerCycle ||
            draft.joinDateCutoffDay !== selectedConfig.joinDateCutoffDay
        );
    }, [draft, selectedConfig]);

    const applyConfigToDraft = (cfg: LeaveConfig) => {
        setDraft({
            baseDaysPerYear: cfg.baseDaysPerYear,
            bonusYearCycle: cfg.bonusYearCycle,
            bonusDaysPerCycle: cfg.bonusDaysPerCycle,
            joinDateCutoffDay: cfg.joinDateCutoffDay,
        });
    };

    const handleCancel = () => {
        if (!selectedConfig) return;
        applyConfigToDraft(selectedConfig);
        setError(null);
    };

    const handleSave = async () => {
        if (!selectedConfig) return;
        try {
            setSaving(true);
            setError(null);
            await policyApi.updateLeaveConfig(selectedConfig.id, {
                baseDaysPerYear: draft.baseDaysPerYear,
                bonusYearCycle: draft.bonusYearCycle,
                bonusDaysPerCycle: draft.bonusDaysPerCycle,
                joinDateCutoffDay: draft.joinDateCutoffDay,
            });
            const refreshed = await policyApi.getAllLeaveConfigs();
            const same = refreshed.find((c) => c.id === selectedConfig.id) ?? refreshed[0] ?? null;
            if (same) setConfig(same);
            if (same) applyConfigToDraft(same);
            toast.success("Leave policy saved successfully");
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
                    <span className="current">Leave Policy</span>
                </div>
                <div className="bod-settings-title">Leave Policy Configuration</div>
            </div>

            <div className="bod-settings-card">
                {loading && <div className="bod-muted">Loading...</div>}
                {!loading && error && <div className="bod-muted" style={{ color: "var(--dh-danger)" }}>{error}</div>}

                {!loading && !error && (
                    <>
                        <div className="bod-policy-card">
                            <div className="bod-policy-card-head">
                                <div className="bod-policy-icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                                <div className="bod-policy-card-title">Annual Quota Parameters</div>
                            </div>

                            <div className="bod-policy-section">
                                <div className="bod-field">
                                    <label>Standard Entitlement (Days / Year)</label>
                                    <input
                                        className="bod-input"
                                        type="number"
                                        min={0}
                                        value={draft.baseDaysPerYear}
                                        onChange={(e) => setDraft((p) => ({ ...p, baseDaysPerYear: Number(e.target.value) }))}
                                        disabled={saving}
                                    />
                                    <div className="bod-hint">Base leave days allocated to all full-time employees</div>
                                </div>
                            </div>

                            <div className="bod-policy-section">
                                <div className="bod-policy-subtitle">Seniority Bonus</div>
                                <div className="bod-policy-subgrid">
                                    <div className="bod-field">
                                        <label>For every … years of service</label>
                                        <input
                                            className="bod-input"
                                            type="number"
                                            min={0}
                                            value={draft.bonusYearCycle}
                                            onChange={(e) => setDraft((p) => ({ ...p, bonusYearCycle: Number(e.target.value) }))}
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="bod-field">
                                        <label>Add … day(s) to quota</label>
                                        <input
                                            className="bod-input"
                                            type="number"
                                            min={0}
                                            value={draft.bonusDaysPerCycle}
                                            onChange={(e) => setDraft((p) => ({ ...p, bonusDaysPerCycle: Number(e.target.value) }))}
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bod-policy-section">
                                <div className="bod-policy-subtitle">Monthly Accrual Cut-off</div>
                                <div className="bod-field">
                                    <select
                                        className="bod-select"
                                        value={draft.joinDateCutoffDay}
                                        onChange={(e) => setDraft((p) => ({ ...p, joinDateCutoffDay: Number(e.target.value) }))}
                                        disabled={saving}
                                    >
                                        {Array.from({ length: 28 }).map((_, idx) => {
                                            const day = idx + 1;
                                            return (
                                                <option key={day} value={day}>
                                                    {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of the month
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="bod-hint">Determines when leave balance is credited for new joiners</div>
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

