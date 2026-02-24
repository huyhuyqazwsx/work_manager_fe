import { useEffect, useState } from "react";
import {
    type UserAuth,
    type UserStatus,
    type UserRole,
} from "../../types/user.types";
import { userApi } from "../../features/user/api/userApi";

import "./employee-directory.css";
import ImportModal from "../../components/Modal/ImportModal.tsx";
import AddEmployeeModal from "../../components/Modal/AddEmployeeModal.tsx";

const PAGE_SIZE = 10;

export default function EmployeeDirectory() {
    const [employees, setEmployees] = useState<UserAuth[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // ✅ Fix async warning
    const fetchEmployees = async () => {
        try {
            const data = await userApi.findAll();
            setEmployees(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // ✅ Properly handle async in useEffect
        void fetchEmployees();
    }, []);

    const roleColor = (role: UserRole) => {
        switch (role.toUpperCase()) {
            case "HR":
                return "pink";
            case "DEPARTMENT_HEAD":
                return "purple";
            case "DIRECTOR":
                return "orange";
            default:
                return "blue";
        }
    };

    const statusColor = (status: UserStatus) => {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "active";
            case "PENDING":
                return "pending";
            case "INACTIVE":
                return "inactive";
            default:
                return "inactive";
        }
    };

    const totalPages = Math.ceil(employees.length / PAGE_SIZE);

    const paginatedEmployees = employees.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    // ✅ Handler với proper async
    const handleImportSuccess = () => {
        void fetchEmployees();
    };

    const handleAddSuccess = () => {
        void fetchEmployees();
    };

    return (
        <div className="employee-directory">
            {/* HEADER */}
            <div className="page-header">
                <h1 className="page-title">Employee Directory</h1>

                <div className="header-actions">
                    <button
                        className="secondary-btn"
                        onClick={() => setIsImportOpen(true)}
                    >
                        Import File
                    </button>

                    <button
                        className="primary-btn"
                        onClick={() => setIsAddOpen(true)}
                    >
                        + Add New Employee
                    </button>
                </div>
            </div>

            <div className="table-card">
                {loading ? (
                    <div className="loading-box">Loading employees...</div>
                ) : (
                    <>
                        <table className="employee-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>EMPLOYEE</th>
                                <th>EMAIL</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th>HIRE DATE</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginatedEmployees.map((emp) => (
                                <tr key={emp.id}>
                                    <td className="col-id">{emp.id}</td>

                                    <td>
                                        <div className="employee-cell">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`}
                                                className="employee-avatar"
                                                alt="avatar"
                                            />
                                            <span className="employee-name">
                                                    {emp.fullName || "—"}
                                                </span>
                                        </div>
                                    </td>

                                    <td>{emp.email}</td>

                                    <td>
                                            <span className={`role-badge ${roleColor(emp.role)}`}>
                                                {emp.role.replace("_", " ")}
                                            </span>
                                    </td>

                                    <td>
                                            <span className={`status ${statusColor(emp.status)}`}>
                                                {emp.status}
                                            </span>
                                    </td>

                                    <td>
                                        {emp.hireDate
                                            ? new Date(emp.hireDate).toLocaleDateString()
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination">
                            <div className="pagination-info">
                                Showing {(page - 1) * PAGE_SIZE + 1}-
                                {Math.min(page * PAGE_SIZE, employees.length)} of{" "}
                                {employees.length}
                            </div>

                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`pagination-btn ${
                                            page === i + 1 ? "active" : ""
                                        }`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    className="pagination-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODALS */}
            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={handleImportSuccess}
            />

            <AddEmployeeModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={handleAddSuccess}
            />
        </div>
    );
}