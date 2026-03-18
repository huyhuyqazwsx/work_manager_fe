import { parseBackendError } from "../../../utils/error.utils";
import { useState, useEffect } from "react";
import { holidayApi } from "../api/holidayApi";
import type { Holiday, HolidayFilterParams } from "../../../types/holiday.types";

// ── Lấy tất cả holidays (có filter) ──────────────────────────────────────────
export function useHolidays(params?: HolidayFilterParams) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.findAll(params);
            setHolidays(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refetch();
    }, [params?.year, params?.month, params?.type]);

    return { holidays, loading, error, refetch };
}

// ── Lấy holiday theo ID ───────────────────────────────────────────────────────
export function useHolidayById(id: string | null) {
    const [holiday, setHoliday] = useState<Holiday | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.findById(id);
            setHoliday(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void refetch();
    }, [id]);

    return { holiday, loading, error, refetch };
}

// ── Lấy upcoming holidays ─────────────────────────────────────────────────────
export function useUpcomingHolidays(limit?: number) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.findUpcoming(limit);
            setHolidays(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refetch();
    }, [limit]);

    return { holidays, loading, error, refetch };
}

// ── Lấy holidays theo year ────────────────────────────────────────────────────
export function useHolidaysByYear(year: number | null) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!year) return;
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.findByYear(year);
            setHolidays(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (year) void refetch();
    }, [year]);

    return { holidays, loading, error, refetch };
}

// ── Lấy compensatory holidays ─────────────────────────────────────────────────
export function useCompensatoryHolidays(year?: number) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.findCompensatory(year);
            setHolidays(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refetch();
    }, [year]);

    return { holidays, loading, error, refetch };
}
