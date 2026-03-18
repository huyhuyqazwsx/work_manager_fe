import { jwtDecode } from 'jwt-decode';
import type { UserRole } from '../types/user.types';

interface JwtPayload {
    sub: string;
    role: UserRole;
    exp: number;
}

function getTokenFromCookie(name: string): string | null {
    const match = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`));
    return match ? match.trim().slice(name.length + 1) : null;
}

function decodeToken(): JwtPayload | null {
    try {
        const token = getTokenFromCookie("accessToken");
        if (!token) return null;
        return jwtDecode<JwtPayload>(token);
    } catch {
        return null;
    }
}

export function getAccessToken(): string | null {
    return getTokenFromCookie("accessToken");
}

export function getRefreshToken(): string | null {
    return getTokenFromCookie("refreshToken");
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