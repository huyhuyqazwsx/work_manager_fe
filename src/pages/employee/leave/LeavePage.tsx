import { useEffect, useState } from "react";
import PersonalLeaveView from "../../../components/leave/PersonalLeaveView";

interface EmployeeLeavePageProps {
    userId: string;
}

export default function EmployeeLeavePage({ userId }: EmployeeLeavePageProps) {
    const [departmentName, setDepartmentName] = useState<string>("");

    useEffect(() => {
        const storedProfile = localStorage.getItem("profile");
        if (storedProfile) {
            try {
                const profile = JSON.parse(storedProfile);
                if (profile.departmentName) {
                    setDepartmentName(profile.departmentName);
                }
            } catch (e) {}
        }
    }, [userId]);

    return (
        <div className="dh-page">
            <div className="dh-page-header">
                <div>
                    <div className="dh-breadcrumb">
                        <span>Home</span>
                        <span>/</span>
                        <span className="current">Leave Management</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <h1 className="dh-page-title">
                            My Leave Requests{departmentName ? `: ${departmentName}` : ""}
                        </h1>
                    </div>
                </div>
            </div>

            <PersonalLeaveView userId={userId} />
        </div>
    );
}