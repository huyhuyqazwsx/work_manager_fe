import { parseBackendError } from "../../../utils/error.utils";
import { useState } from "react";
import { userApi } from "../api/userApi.ts";

export function useVerifyEmailMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const verifyEmail = async (email: string, token: string) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            const response = await userApi.verifyEmail({ email, token });
            setSuccess(true);
            return response;
        } catch (err: any) {
            const errorMessage = parseBackendError(err, err.message);
            setError(errorMessage);
            setSuccess(false);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSuccess(false);
        setError(null);
    };

    return {
        verifyEmail,
        loading,
        error,
        success,
        reset
    };
}