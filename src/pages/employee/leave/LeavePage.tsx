import "../home/home.css";

export default function LeaveManagementPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span className="current">Leave Management</span>
                    </div>
                    <h1 className="page-title">My Leave Management</h1>
                </div>
                <button className="primary-btn">+ New Request</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card balance-card">
                    <div className="stat-label">CURRENT BALANCE</div>
                    <div className="stat-value-large">10.5 / 12.0 Days</div>
                    <div className="stat-footer">Valid until Feb 11, 2026</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">USED ANNUAL LEAVE</div>
                    <div className="stat-value">1.5 Days</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">UNPAID</div>
                    <div className="stat-value">0 Days</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">COMPENSATORY FUND</div>
                    <div className="stat-value">+4.0 HOURS</div>
                </div>
            </div>

            <div className="content-section">
                <div className="section-header">
                    <input type="text" className="search-input" placeholder="Search" />
                </div>

                <div className="table-container">
                    <p className="placeholder-text">
                        Leave requests table will appear here
                    </p>
                </div>
            </div>
        </div>
    );
}