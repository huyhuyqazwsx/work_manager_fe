import OTReportView from "./report/OTReportView";
import LeaveReportView from "./report/LeaveReportView";

interface Props {
    section: "leave" | "ot";
    userId?: string;
}

export default function ReportPage({ section, userId = "" }: Props) {
    if (section === "ot") return <OTReportView userId={userId} />;
    return <LeaveReportView />;
}
