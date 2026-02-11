import { useState, useEffect } from "react";
import { userApi } from "../api/userApi.ts";
import type {UserAuth} from "../../../types/user.types.ts";

// Hook để lấy tất cả users
export function useAllUsers() {
    const [users, setUsers] = useState<UserAuth[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userApi.findAll();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, []);

    return { users, loading, error, refetch };
}

// Hook để lấy user by ID
export function useUserById(id: string | null) {
    const [user, setUser] = useState<UserAuth | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const data = await userApi.findById(id);
            setUser(data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            refetch();
        }
    }, [id]);

    return { user, loading, error, refetch };
}

// Hook để lấy user by email
export function useUserByEmail(email: string | null) {
    const [user, setUser] = useState<UserAuth | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!email) return;

        try {
            setLoading(true);
            setError(null);
            const data = await userApi.findByEmail(email);
            setUser(data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (email) {
            refetch();
        }
    }, [email]);

    return { user, loading, error, refetch };
}