import { jwtDecode } from 'jwt-decode';
import type { UserRole } from '../types/user.types';

interface JwtPayload {
    sub: string;
    role: UserRole;
    exp: number;
}

export function getRoleFromCookie(): UserRole | null {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    if (!tokenCookie) return null;

    try {
        const token = tokenCookie.split('=')[1];
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.role;
    } catch {
        return null;
    }
}