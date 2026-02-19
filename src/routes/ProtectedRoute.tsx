import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import {getRoleFromCookie} from "../utils/auth.utils.ts";
import type {UserRole} from "../types/user.types.ts";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const role = getRoleFromCookie();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}