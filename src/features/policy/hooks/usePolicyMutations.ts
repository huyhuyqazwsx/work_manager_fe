import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { policyApi } from "../api/policyApi";
import type {
    CreateLeaveConfigDto,
    CreateOTConfigDto,
    CreatePaidPersonalEventDto,
    UpdateLeaveConfigDto,
    UpdateOTConfigDto,
    UpdatePaidPersonalEventDto
} from "../../../types/policy.types";

export function usePolicyMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMutation = async (mutationFn: () => Promise<void>, onSuccess?: () => void) => {
        try {
            setIsLoading(true);
            setError(null);
            await mutationFn();
            onSuccess?.();
        } catch (err: any) {
            setError(parseBackendError(err, err.message));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        createLeaveConfig: (data: CreateLeaveConfigDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.createLeaveConfig(data), onSuccess),
        updateLeaveConfig: (id: string, data: UpdateLeaveConfigDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.updateLeaveConfig(id, data), onSuccess),
        deleteLeaveConfig: (id: string, onSuccess?: () => void) =>
            handleMutation(() => policyApi.deleteLeaveConfig(id), onSuccess),

        createOTConfig: (data: CreateOTConfigDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.createOTConfig(data), onSuccess),
        updateOTConfig: (id: string, data: UpdateOTConfigDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.updateOTConfig(id, data), onSuccess),
        deleteOTConfig: (id: string, onSuccess?: () => void) =>
            handleMutation(() => policyApi.deleteOTConfig(id), onSuccess),

        createPaidPersonalEvent: (data: CreatePaidPersonalEventDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.createPaidPersonalEvent(data), onSuccess),
        updatePaidPersonalEvent: (id: string, data: UpdatePaidPersonalEventDto, onSuccess?: () => void) =>
            handleMutation(() => policyApi.updatePaidPersonalEvent(id, data), onSuccess),
        deletePaidPersonalEvent: (id: string, onSuccess?: () => void) =>
            handleMutation(() => policyApi.deletePaidPersonalEvent(id), onSuccess),
    };
}
