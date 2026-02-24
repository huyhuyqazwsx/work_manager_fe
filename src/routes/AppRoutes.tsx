import LoginPage from "../pages/auth/handle-status/LoginPage.tsx";
import {Navigate, Route, Routes} from "react-router-dom";
import HandleStatusPage from "../pages/auth/handle-status/HandleStatusPage.tsx";
import VerifyPage from "../pages/auth/handle-status/VerifyPage.tsx";
import InactivePage from "../pages/auth/handle-status/InactivePage.tsx";
import EmailNotFoundPage from "../pages/auth/handle-status/EmailNotFoundPage.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";
import { UserRole } from '../types/user.types';
import HomePage from "../pages/employee/home/HomePage.tsx";
import HRHomePage from "../pages/hr/HRHomePage.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            {/* ========= AUTH ========= */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/handle-status" element={<HandleStatusPage />} />
            <Route path="/auth/verify" element={<VerifyPage />} />
            <Route path="/inactive" element={<InactivePage />} />
            <Route path="/email-not-found" element={<EmailNotFoundPage />} />
            {/*<Route path="/unauthorized" element={<UnauthorizedPage />} />*/}

            {/* ========= EMPLOYEE ========= */}
            <Route path="/employee" element={
                <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
                    <HomePage />
                </ProtectedRoute>
            } />

            {/* ========= DEPARTMENT HEAD ========= */}
            <Route path="/department-head" element={
                <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                    <HomePage />
                </ProtectedRoute>
            } />

            {/* ========= HR ========= */}
            <Route path="/hr" element={
                <ProtectedRoute allowedRoles={[UserRole.HR]}>
                    <HRHomePage />
                </ProtectedRoute>
            } />

            {/* ========= BOD ========= */}
            <Route path="/bod" element={
                <ProtectedRoute allowedRoles={[UserRole.BOD]}>
                    <HomePage />
                </ProtectedRoute>
            } />

            {/* ========= FALLBACK ========= */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}