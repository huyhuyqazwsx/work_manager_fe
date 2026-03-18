import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { holidayApi } from "../api/holidayApi";
import type {
    CreateHolidayPayload,
    UpdateHolidayPayload,
    CreateHolidayResponse,
    GenerateRecurringResult,
} from "../../../types/holiday.types";

// ── Tạo holiday mới ───────────────────────────────────────────────────────────
export function useCreateHoliday() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createHoliday = async (
        data: CreateHolidayPayload
    ): Promise<CreateHolidayResponse> => {
        try {
            setLoading(true);
            setError(null);
            return await holidayApi.create(data);
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createHoliday, loading, error };
}

// ── Cập nhật holiday ──────────────────────────────────────────────────────────
export function useUpdateHoliday() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateHoliday = async (
        id: string,
        data: UpdateHolidayPayload
    ): Promise<{ message: string }> => {
        try {
            setLoading(true);
            setError(null);
            return await holidayApi.update(id, data);
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateHoliday, loading, error };
}

// ── Xóa holiday ───────────────────────────────────────────────────────────────
export function useDeleteHoliday() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteHoliday = async (id: string): Promise<{ message: string }> => {
        try {
            setLoading(true);
            setError(null);
            return await holidayApi.delete(id);
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteHoliday, loading, error };
}

// ── Generate recurring holidays cho năm ───────────────────────────────────────
export function useGenerateRecurringHolidays() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerateRecurringResult | null>(null);

    const generate = async (year: number): Promise<GenerateRecurringResult> => {
        try {
            setLoading(true);
            setError(null);
            const data = await holidayApi.generateRecurring(year);
            setResult(data);
            return data;
        } catch (err: any) {
            const msg = parseBackendError(err, err.message);
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
    };

    return { generate, loading, error, result, reset };
}
