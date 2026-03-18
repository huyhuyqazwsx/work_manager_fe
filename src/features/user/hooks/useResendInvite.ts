import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { userApi } from "../api/userApi.ts";

export function useResendInvite() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const resendInvite = async (email: string) => {
        try {
            setLoading(true);
            setError(null);
            setMessage(null);
            const response = await userApi.resendInvite({ email });
            setMessage(response.message);
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
        setMessage(null);
        setError(null);
    };

    return {
        resendInvite,
        loading,
        error,
        message,
        reset
    };
}