import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { userApi } from "../api/userApi.ts";
import type { InviteUsersResult } from "../../../types/user.types";

export function useInviteUsers() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<InviteUsersResult | null>(null);

    const inviteUsers = async (emails: string[]) => {
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.invite({ emails });
            setResult(response);
            return response;
        } catch (err: any) {
            const errorMessage = parseBackendError(err, err.message);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
    };

    return {
        inviteUsers,
        loading,
        error,
        result,
        reset
    };
}