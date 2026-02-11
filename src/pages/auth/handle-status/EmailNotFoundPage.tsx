import { useLocation, useNavigate } from "react-router-dom";
import "./email-not-found.css";

export default function EmailNotFoundPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { email } = location.state || {};

    return (
        <div className="notfound-root">
            <div className="notfound-card">
                <div className="icon">❌</div>

                <h1>Email Not Found</h1>

                <p className="desc">
                    The email address below does not exist in our system.
                </p>

                {email && (
                    <div className="email-box">
                        {email}
                    </div>
                )}

                <p className="hint">
                    This system is restricted to authorized employees only.
                    <br />
                    Please contact your HR or IT administrator if you believe this is a mistake.
                </p>

                <button
                    className="primary-btn"
                    onClick={() => navigate("/login")}
                >
                    ← Back to Login
                </button>
            </div>
        </div>
    );
}
