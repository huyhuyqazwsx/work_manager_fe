import EmployeeOTPage from "../employee/ot/OTPage";

interface OTManagementPageProps {
    userId: string;
}

export default function OTManagementPage({ userId }: OTManagementPageProps) {
    return <EmployeeOTPage userId={userId} />;
}
