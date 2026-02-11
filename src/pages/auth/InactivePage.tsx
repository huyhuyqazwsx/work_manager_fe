import { useLocation, useNavigate } from "react-router-dom";
import { useResendInvite } from "../../features/user/hooks/useResendInvite";
import "./inactive.css";

export default function InactivePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { resendInvite, loading, error, message } = useResendInvite();

    const { email, reason, error: verifyError, errorType } = location.state || {};

    const isPending = reason === "PENDING";
    const isInactive = reason === "INACTIVE";

    const handleResend = async () => {
        if (!email) {
            navigate("/login");
            return;
        }
        await resendInvite(email);
    };

    // Icon theo loại lỗi
    const getErrorIcon = () => {
        switch (errorType) {
            case 'expired': return '⏰';
            case 'invalid': return '🔗';
            case 'notfound': return '❓';
            case 'forbidden': return '🚫';
            default: return '❌';
        }
    };

    return (
        <div className="inactive-root">
            <div className="inactive-card">
                {/* Header */}
                <div className="inactive-header">
                    <div className="status-icon">
                        {isPending ? "⏳" : "🚫"}
                    </div>

                    <h1>
                        Account {isPending ? "Pending Verification" : "Inactive"}
                    </h1>

                    {email && <p className="email">{email}</p>}

                    <div className={`status-badge ${isPending ? "pending" : "inactive"}`}>
                        {isPending ? "PENDING" : "INACTIVE"}
                    </div>
                </div>

                {/* Verification Error - Hiển thị nổi bật */}
                {verifyError && (
                    <div className={`error-banner ${errorType}`}>
                        <div className="error-icon">{getErrorIcon()}</div>
                        <div className="error-content">
                            <strong>Verification Failed</strong>
                            <p>{verifyError}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="inactive-content">
                    {isPending && !verifyError && (
                        <>
                            <p className="primary">
                                📧 A verification email has been sent to your inbox.
                            </p>
                            <p className="secondary">
                                Please check your email and click the verification link to activate your account.
                            </p>
                        </>
                    )}

                    {isInactive && (
                        <p className="danger">
                            This account has been deactivated and removed from the system.
                            <br />
                            Please contact your HR or IT administrator if you believe this is a mistake.
                        </p>
                    )}
                </div>

                {/* Resend Error/Success */}
                {error && <div className="alert error">❌ {error}</div>}
                {message && <div className="alert success">✅ {message}</div>}

                {/* Actions */}
                <div className="actions">
                    {isPending && (
                        <button
                            className="primary-btn"
                            disabled={loading}
                            onClick={handleResend}
                        >
                            {loading ? "📤 Sending..." : "📧 Resend Verification Email"}
                        </button>
                    )}

                    <button
                        className="ghost-btn"
                        onClick={() => navigate("/login")}
                    >
                        ← Back to Login
                    </button>
                </div>

                {/* Help Box */}
                {isPending && !verifyError && (
                    <div className="help-box">
                        <strong>💡 Didn't receive the email?</strong>
                        <ul>
                            <li>Check your spam or junk folder</li>
                            <li>Wait a few minutes for delivery</li>
                            <li>Click "Resend" above</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}