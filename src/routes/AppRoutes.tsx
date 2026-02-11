import { Routes, Route, Navigate } from "react-router-dom";
import HandleStatusPage from "../pages/auth/handle-status/HandleStatusPage.tsx";
import LoginPage from "../pages/auth/handle-status/LoginPage.tsx";
import InactivePage from "../pages/auth/InactivePage.tsx";
import VerifyPage from "../pages/auth/handle-status/VerifyPage.tsx";
import HomePage from "../pages/home/HomePage.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";
import EmailNotFoundPage from "../pages/auth/handle-status/EmailNotFoundPage.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            {/* ========= AUTH ========= */}
            <Route path="/login" element={<LoginPage />} />

            {/* Zoho callback → BE redirect về đây */}
            <Route
                path="/auth/handle-status"
                element={<HandleStatusPage />}
            />

            {/* Click link email */}
            <Route path="/auth/verify" element={<VerifyPage />} />

            {/* Account inactive/pending */}
            <Route path="/inactive" element={<InactivePage />} />

            {/* Account none */}
            <Route path="/email-not-found" element={<EmailNotFoundPage />} />

            {/* ========= MAIN ========= */}
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />

            {/* ========= FALLBACK ========= */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}