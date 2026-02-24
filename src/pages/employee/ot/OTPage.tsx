import "../home/home.css";

export default function OTManagementPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span className="current">OT Management</span>
                    </div>
                    <h1 className="page-title">My OT Management</h1>
                </div>
                <button className="primary-btn">+ New Request</button>
            </div>

            <div className="content-section">
                <p className="placeholder-text">
                    OT management content will appear here
                </p>
            </div>
        </div>
    );
}