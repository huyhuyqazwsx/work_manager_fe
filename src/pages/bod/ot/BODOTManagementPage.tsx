import "../../employee/home/home.css";
import BODOTView from "./BODOTView";

interface BODOTManagementPageProps {
    userId: string;
}

export default function BODOTManagementPage({ userId }: BODOTManagementPageProps) {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span className="current">OT Management</span>
                    </div>
                    <h1 className="page-title">
                        Enterprise Approvals Queue
                    </h1>
                </div>
            </div>

            <div className="content-section">
                <BODOTView userId={userId} />
            </div>
        </div>
    );
}
