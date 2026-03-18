import { jwtDecode } from 'jwt-decode';
import type { UserRole } from '../types/user.types';

interface JwtPayload {
    sub: string;
    role: UserRole;
    exp: number;
}

function decodeToken(): JwtPayload | null {
    try {
        // Try localStorage first (cross-domain production)
        const lsToken = localStorage.getItem("accessToken");
        if (lsToken) return jwtDecode<JwtPayload>(lsToken);

        // Fallback: cookie (same-domain / local dev)
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
        if (!tokenCookie) return null;
        return jwtDecode<JwtPayload>(tokenCookie.split('=')[1]);
    } catch {
        return null;
    }
}

export function getRoleFromCookie(): UserRole | null {
    const role = decodeToken()?.role ?? null;
    console.log("[getRoleFromCookie] cookies =", document.cookie || "(empty)", "| role =", role);
    return role;
}

export function getUserIdFromCookie(): string | null {
    return decodeToken()?.sub ?? null;
}

export function isTokenExpired(): boolean {
    const decoded = decodeToken();
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
}

export function getUserFromStorage(): any | null {
    try {
        const userStr = localStorage.getItem('profile');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}