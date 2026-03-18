import "./ImportResultModal.css";
import type { InviteImportResponse } from "../../types/invite.type";

interface ImportResultModalProps {
    isOpen: boolean;
    result: InviteImportResponse | null;
    onClose: () => void;
    onRetry: () => void;
}

export default function ImportResultModal({
    isOpen,
    result,
    onClose,
    onRetry,
}: ImportResultModalProps) {
    if (!isOpen || !result) return null;

    const hasErrors = result.failed > 0;
    const inviteResult = result.inviteResult;

    return (
        <div className="import-modal-overlay" onClick={onClose}>
            <div
                className="import-modal-content large"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="import-modal-header">
                    <h2>Import Validation Report</h2>
                    <button className="import-modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="import-modal-body">
                    {/* BANNER */}
                    {hasErrors ? (
                        <div className="validation-banner error">
                            <div className="banner-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            </div>
                            <div className="banner-content">
                                <strong>Import Failed: {result.failed} Errors Found</strong>
                                <p>The system detected critical issues in your data file. The rows below could not be processed. Please correct your file and re-upload.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="validation-banner success">
                            <div className="banner-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                            <div className="banner-content">
                                <strong>Import Successful!</strong>
                                <p>All {result.success} employees were processed successfully.</p>
                            </div>
                        </div>
                    )}

                    {/* STATS */}
                    <div className="validation-stats-row">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Total Rows Processed</span>
                                <div className="stat-icon gray">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </div>
                            </div>
                            <div className="stat-value">{result.total}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Valid Rows</span>
                                <div className="stat-icon green">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                            </div>
                            <div className="stat-value"><span className="dot green"></span>{result.success}</div>
                        </div>

                        <div className="stat-card error-card">
                            <div className="stat-header">
                                <span className="stat-label error-text">Invalid Rows</span>
                                <div className="stat-icon red">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                </div>
                            </div>
                            <div className="stat-value error-text"><span className="dot red"></span>{result.failed}</div>
                        </div>
                    </div>

                    {/* INVITE RESULTS - Hiển thị khi không có lỗi */}
                    {!hasErrors && inviteResult && (
                        <div className="invite-results">
                            <h3>Processing Results</h3>

                            {/* PENDING */}
                            {inviteResult.PENDING.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header pending">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="1.5" />
                                            <path d="M8 5V8L10 10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <strong>Pending ({inviteResult.PENDING.length})</strong>
                                        <span className="result-badge pending">Invitation Sent</span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.PENDING.map((email, idx) => (
                                            <div key={idx} className="email-item">{email}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTIVE */}
                            {inviteResult.ACTIVE.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header active">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="6" stroke="#16A34A" strokeWidth="1.5" />
                                            <path d="M5 8L7 10L11 6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <strong>Active ({inviteResult.ACTIVE.length})</strong>
                                        <span className="result-badge active">Already Active</span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.ACTIVE.map((email, idx) => (
                                            <div key={idx} className="email-item">{email}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INACTIVE */}
                            {inviteResult.INACTIVE.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header inactive">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="6" stroke="#94A3B8" strokeWidth="1.5" />
                                            <path d="M6 6L10 10M10 6L6 10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <strong>Inactive ({inviteResult.INACTIVE.length})</strong>
                                        <span className="result-badge inactive">Account Disabled</span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.INACTIVE.map((email, idx) => (
                                            <div key={idx} className="email-item">{email}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ERROR TABLE - Hiển thị khi có lỗi */}
                    {hasErrors && result.errors.length > 0 && (
                        <div className="error-section">
                            <div className="error-section-header">
                                <h3>Error Details Log</h3>
                                <span>Showing {result.errors.length} of {result.failed} errors</span>
                            </div>

                            <div className="error-table-wrapper">
                                <table className="error-table">
                                    <thead>
                                        <tr>
                                            <th>ROW</th>
                                            <th>EMAIL ADDRESS</th>
                                            <th>FIELD</th>
                                            <th>ERROR DESCRIPTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.errors.map((error, idx) => (
                                            <tr key={idx}>
                                                <td className="row-number">{error.row < 10 ? `0${error.row}` : error.row}</td>
                                                <td className="email-cell">
                                                    {error.field === "email" ? (
                                                        <span className="error-pill">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            {error.email || "Missing Email"}
                                                        </span>
                                                    ) : (
                                                        error.email || "—"
                                                    )}
                                                </td>
                                                <td className="field-cell">
                                                    {error.field !== "email" ? (
                                                        <span className="error-pill warning">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                            {error.field || "—"}
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                                <td className="error-cell-text">
                                                    {error.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="import-modal-footer">
                    {hasErrors ? (
                        <>
                            <button className="import-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="import-btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Re-upload File
                            </button>
                        </>
                    ) : (
                        <button className="import-btn-primary" onClick={onClose}>
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}