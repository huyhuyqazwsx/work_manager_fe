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
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content large"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="modal-header">
                    <h2>Import Validation Report</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {/* BANNER */}
                    {hasErrors ? (
                        <div className="result-banner error">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="#DC2626" strokeWidth="1.5"/>
                                <path d="M10 6V10M10 14H10.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <div>
                                <strong>Import Failed: {result.failed} Errors Found</strong>
                                <p>
                                    The system detected critical issues in your data file.
                                    The rows below could not be processed. Please correct
                                    your file and re-upload.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="result-banner success">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="#16A34A" strokeWidth="1.5"/>
                                <path d="M7 10L9 12L13 8" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <div>
                                <strong>Import Successful!</strong>
                                <p>All {result.success} employees were processed successfully.</p>
                            </div>
                        </div>
                    )}

                    {/* STATS */}
                    <div className="result-stats">
                        <div className="stat-box">
                            <div className="stat-label">Total Rows</div>
                            <div className="stat-value">{result.total}</div>
                        </div>

                        <div className="stat-box success">
                            <div className="stat-label">Valid Rows</div>
                            <div className="stat-value">{result.success}</div>
                        </div>

                        <div className="stat-box error">
                            <div className="stat-label">Invalid Rows</div>
                            <div className="stat-value">{result.failed}</div>
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
                                            <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="1.5"/>
                                            <path d="M8 5V8L10 10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <strong>Pending ({inviteResult.PENDING.length})</strong>
                                        <span className="result-badge pending">
                                            Invitation Sent
                                        </span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.PENDING.map((email, idx) => (
                                            <div key={idx} className="email-item">
                                                {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTIVE */}
                            {inviteResult.ACTIVE.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header active">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="6" stroke="#16A34A" strokeWidth="1.5"/>
                                            <path d="M5 8L7 10L11 6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <strong>Active ({inviteResult.ACTIVE.length})</strong>
                                        <span className="result-badge active">
                                            Already Active
                                        </span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.ACTIVE.map((email, idx) => (
                                            <div key={idx} className="email-item">
                                                {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INACTIVE */}
                            {inviteResult.INACTIVE.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header inactive">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="6" stroke="#94A3B8" strokeWidth="1.5"/>
                                            <path d="M6 6L10 10M10 6L6 10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <strong>Inactive ({inviteResult.INACTIVE.length})</strong>
                                        <span className="result-badge inactive">
                                            Account Disabled
                                        </span>
                                    </div>
                                    <div className="email-list">
                                        {inviteResult.INACTIVE.map((email, idx) => (
                                            <div key={idx} className="email-item">
                                                {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ERROR TABLE - Hiển thị khi có lỗi */}
                    {hasErrors && result.errors.length > 0 && (
                        <div className="error-section">
                            <div className="error-header">
                                <h3>Error Details Log</h3>
                                <p>Showing {result.errors.length} of {result.failed} errors</p>
                            </div>

                            <div className="error-table-wrapper">
                                <table className="error-table">
                                    <thead>
                                    <tr>
                                        <th>ROW</th>
                                        <th>EMAIL</th>
                                        <th>FIELD</th>
                                        <th>ERROR DESCRIPTION</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {result.errors.map((error, idx) => (
                                        <tr key={idx}>
                                            <td className="row-number">{error.row}</td>
                                            <td className="email-cell">
                                                {error.email || "—"}
                                            </td>
                                            <td className="field-cell">
                                                {error.field || "—"}
                                            </td>
                                            <td className="error-cell">
                                                {error.reason}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="error-tip">
                                💡 <strong>Common fixes:</strong> Check for typos in email
                                addresses, ensure all required fields are filled, verify dates
                                are in DD/MM/YYYY format, and check for duplicate emails.
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    {hasErrors ? (
                        <>
                            <button className="btn-cancel" onClick={onClose}>
                                Close
                            </button>
                            <button className="btn-primary" onClick={onRetry}>
                                Re-upload File
                            </button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={onClose}>
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}