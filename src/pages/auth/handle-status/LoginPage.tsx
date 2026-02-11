import './login.css';
import {authApi} from "../../../features/auth/api/authApi.ts";

export default function LoginPage() {
    const handleZohoLogin = () => {
        authApi.loginWithZoho();
        console.log('Login with Zoho');
    };

    return (
        <div className="login-root">
            {/* Animated background */}
            <div className="background-animation">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            {/* Left Panel */}
            <div className="left-panel">
                <div className="brand-container">
                    <div className="logo-wrapper">
                        <div className="logo">
                            <span>S</span>
                        </div>
                        <div className="logo-glow"></div>
                    </div>

                    <h1 className="brand-title">Unified HR Management</h1>
                    <p className="brand-subtitle">
                        Streamline your workforce, automate processes, and empower your people.
                    </p>

                    <div className="features">
                        <div className="feature-item">
                            <div className="feature-icon">✓</div>
                            <span>Enterprise-grade Security</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">✓</div>
                            <span>Seamless Integration</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">✓</div>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Card */}
            <div className="right-panel">
                <div className="login-card">
                    <div className="card-header">
                        <h2 className="welcome-title">Welcome Back</h2>
                        <p className="welcome-desc">
                            Access your workspace using your corporate Zoho account.
                        </p>
                    </div>

                    <div className="card-body">
                        <button className="zoho-btn" onClick={handleZohoLogin}>
                            <div className="btn-content">
                                <img
                                    src="https://www.zoho.com/favicon.ico"
                                    alt="Zoho"
                                    className="zoho-icon"
                                />
                                <span>Log in with Zoho</span>
                            </div>
                            <div className="btn-shine"></div>
                        </button>

                        <div className="divider">
                            <span>SECURE SSO</span>
                        </div>

                        <div className="security-badge">
                            <div className="lock-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3z" fill="currentColor"/>
                                </svg>
                            </div>
                            <p className="security-text">
                                This is a secure enterprise environment. Authentication is handled
                                exclusively via your organization's provider.
                            </p>
                        </div>

                        <a className="support-link" href="#">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" fill="currentColor"/>
                                <path d="M11 11h2v6h-2zm0-4h2v2h-2z" fill="currentColor"/>
                            </svg>
                            Having trouble? Contact IT Support
                        </a>
                    </div>

                    <footer className="card-footer">
                        © 2024 Enterprise HRM Systems Inc.
                    </footer>
                </div>
            </div>
        </div>
    );
}