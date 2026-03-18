import { parseBackendError } from "../../../utils/error.utils";
import { useState, useEffect } from "react";
import { departmentApi } from "../api/departmentApi";
import type { Department } from "../../../types/department.types";

// ── Lấy tất cả departments ────────────────────────────────────────────────────
export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await departmentApi.findAll();
            setDepartments(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refetch();
    }, []);

    return { departments, loading, error, refetch };
}

// ── Lấy department theo ID ────────────────────────────────────────────────────
export function useDepartmentById(id: string | null) {
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const data = await departmentApi.findById(id);
            setDepartment(data);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) void refetch();
    }, [id]);

    return { department, loading, error, refetch };
}
