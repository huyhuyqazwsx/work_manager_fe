import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { departmentApi } from "../api/departmentApi";
import type {
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
} from "../../../types/department.types";

// ── Tạo department ────────────────────────────────────────────────────────────
export function useCreateDepartment(onSuccess?: () => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async (data: CreateDepartmentPayload) => {
        try {
            setLoading(true);
            setError(null);
            await departmentApi.create(data);
            onSuccess?.();
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { create, loading, error };
}

// ── Cập nhật department ───────────────────────────────────────────────────────
export function useUpdateDepartment(onSuccess?: () => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = async (id: string, data: UpdateDepartmentPayload) => {
        try {
            setLoading(true);
            setError(null);
            await departmentApi.update(id, data);
            onSuccess?.();
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { update, loading, error };
}

// ── Xoá department ────────────────────────────────────────────────────────────
export function useDeleteDepartment(onSuccess?: () => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await departmentApi.delete(id);
            onSuccess?.();
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { remove, loading, error };
}
