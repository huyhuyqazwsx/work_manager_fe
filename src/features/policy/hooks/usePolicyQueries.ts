import { parseBackendError } from "../../../utils/error.utils";
import { useState, useEffect, useCallback } from "react";
import { policyApi } from "../api/policyApi";
import type { LeaveConfig, OTConfig, PaidPersonalLeaveEvent } from "../../../types/policy.types";

export function useAllLeaveConfigs() {
    const [data, setData] = useState<LeaveConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await policyApi.getAllLeaveConfigs();
            setData(res);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    return { data, isLoading, error, refetch: fetchConfigs };
}

export function useAllOTConfigs() {
    const [data, setData] = useState<OTConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await policyApi.getAllOTConfigs();
            setData(res);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    return { data, isLoading, error, refetch: fetchConfigs };
}

export function useAllPaidPersonalEvents() {
    const [data, setData] = useState<PaidPersonalLeaveEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await policyApi.getAllPaidPersonalEvents();
            setData(res);
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { data, isLoading, error, refetch: fetchEvents };
}
