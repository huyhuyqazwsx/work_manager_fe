import { Navigate } from "react-router-dom";
import type {ReactNode} from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const isAuth = localStorage.getItem("FAKE_AUTH");

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
