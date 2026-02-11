import { useState } from "react";
import {type InviteUsersResult, userApi} from "../api/userApi.ts";

export function useInviteUsers() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<InviteUsersResult | null>(null);

    const inviteUsers = async (emails: string[]) => {
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.inviteUsers({ emails });
            setResult(response.data);
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message;
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