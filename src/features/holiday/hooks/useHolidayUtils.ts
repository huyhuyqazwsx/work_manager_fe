import { parseBackendError } from "../../../utils/error.utils";
import { useState, useEffect } from "react";
import { holidayApi } from "../api/holidayApi";
import type {
    HolidayTotalDays,
    LeaveDaysCalculation,
    HolidayDateCheck,
    CalculateLeaveDaysParams,
} from "../../../types/holiday.types";

// ── Tính tổng ngày nghỉ trong năm ────────────────────────────────────────────
export function useHolidayTotalDays(year: number | null) {
    const [data, setData] = useState<HolidayTotalDays | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!year) return;
        try {
            setLoading(true);
            setError(null);
            const result = await holidayApi.getTotalDaysByYear(year);
            setData(result);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (year) void refetch();
    }, [year]);

    return { data, loading, error, refetch };
}

// ── Tính số ngày nghỉ phép thực tế ───────────────────────────────────────────
export function useCalculateLeaveDays() {
    const [data, setData] = useState<LeaveDaysCalculation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculate = async (params: CalculateLeaveDaysParams) => {
        try {
            setLoading(true);
            setError(null);
            const result = await holidayApi.calculateLeaveDays(params);
            setData(result);
            return result;
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setData(null);
        setError(null);
    };

    return { calculate, data, loading, error, reset };
}

// ── Kiểm tra một ngày có phải ngày lễ không ──────────────────────────────────
export function useCheckHolidayDate(date: string | null) {
    const [data, setData] = useState<HolidayDateCheck | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!date) return;
        try {
            setLoading(true);
            setError(null);
            const result = await holidayApi.checkDate(date);
            setData(result);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (date) void refetch();
    }, [date]);

    return { data, loading, error, refetch };
}
