import './login.css';
import { authApi } from "../../../features/auth/api/authApi.ts";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "../../../components/toast/toast";

const CitySkyline = () => (
    <svg className="city-skyline" viewBox="0 0 900 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        <g fill="rgba(255,255,255,0.08)">
            {/* Far buildings */}
            <rect x="0" y="140" width="40" height="60" />
            <rect x="8" y="120" width="24" height="20" />
            <rect x="45" y="130" width="30" height="70" />
            <rect x="52" y="110" width="16" height="20" />
            <rect x="80" y="100" width="35" height="100" />
            <rect x="88" y="80" width="18" height="22" />
            <rect x="92" y="72" width="10" height="10" />
            <rect x="120" y="120" width="28" height="80" />
            <rect x="125" y="105" width="18" height="17" />
            <rect x="152" y="90" width="42" height="110" />
            <rect x="162" y="70" width="22" height="22" />
            <rect x="167" y="58" width="12" height="14" />
            <rect x="198" y="115" width="32" height="85" />
            <rect x="235" y="85" width="48" height="115" />
            <rect x="247" y="65" width="24" height="22" />
            <rect x="252" y="52" width="14" height="15" />
            <rect x="287" y="130" width="25" height="70" />
            <rect x="316" y="95" width="38" height="105" />
            <rect x="327" y="75" width="16" height="22" />
            <rect x="358" y="120" width="28" height="80" />
            <rect x="390" y="80" width="50" height="120" />
            <rect x="403" y="60" width="24" height="22" />
            <rect x="408" y="48" width="14" height="14" />
            <rect x="444" y="100" width="35" height="100" />
            <rect x="453" y="82" width="18" height="20" />
            <rect x="483" y="115" width="30" height="85" />
            <rect x="517" y="88" width="44" height="112" />
            <rect x="528" y="68" width="22" height="22" />
            <rect x="533" y="56" width="12" height="14" />
            <rect x="565" y="125" width="28" height="75" />
            <rect x="597" y="95" width="36" height="105" />
            <rect x="608" y="75" width="14" height="22" />
            <rect x="637" y="108" width="40" height="92" />
            <rect x="648" y="88" width="20" height="22" />
            <rect x="681" y="90" width="46" height="110" />
            <rect x="693" y="70" width="22" height="22" />
            <rect x="698" y="58" width="12" height="14" />
            <rect x="731" y="118" width="30" height="82" />
            <rect x="765" y="100" width="38" height="100" />
            <rect x="776" y="80" width="16" height="22" />
            <rect x="807" y="128" width="26" height="72" />
            <rect x="836" y="90" width="42" height="110" />
            <rect x="847" y="70" width="20" height="22" />
            <rect x="852" y="58" width="10" height="14" />
            <rect x="880" y="115" width="20" height="85" />
        </g>
        {/* Ground line */}
        <rect x="0" y="198" width="900" height="4" fill="rgba(255,255,255,0.06)" />
    </svg>
);

export default function LoginPage() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const state = location.state as { message?: string; variant?: "success" | "error" } | null;
        const msg = state?.message;
        if (!msg) return;

        const variant = state?.variant ?? "success";
        if (variant === "error") toast.error(msg);
        else toast.success(msg);

        navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleZohoLogin = () => {
        authApi.loginWithZoho();
    };

    return (
        <div className="login-root">
            {/* Left Panel */}
            <div className="login-left">
                <div className="login-left-content">
                    {/* Logo S */}
                    <div className="login-logo-wrap">
                        <div className="login-logo-glow" />
                        <div className="login-logo">S</div>
                    </div>

                    {/* Brand name */}
                    <div className="login-brand">
                        <div className="login-brand-line1">SKYCORP HRM</div>
                        <div className="login-brand-line2">SYSTEM</div>
                    </div>
                </div>

                {/* City skyline */}
                <CitySkyline />
            </div>

            {/* Right Panel */}
            <div className="login-right">
                <div className="login-card">
                    <div className="login-card-body">
                        <h2 className="login-title">Welcome Back</h2>
                        <p className="login-desc">
                            Please sign in with your corporate account to continue accessing the dashboard.
                        </p>

                        {/* Zoho button */}
                        <button className="login-zoho-btn" onClick={handleZohoLogin} type="button">
                            <img
                                src="https://www.zoho.com/favicon.ico"
                                alt="Zoho"
                                className="login-zoho-icon"
                            />
                            <span>Sign in with Zoho</span>
                            <svg className="login-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* Divider */}
                        <div className="login-divider">
                            <span>SECURE ACCESS</span>
                        </div>

                        {/* SSO info */}
                        <div className="login-sso-info">
                            <svg className="login-sso-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                                <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                            </svg>
                            <p>
                                This system uses Single Sign-On (SSO). Standard email and password login has been disabled to meet security requirements.
                            </p>
                        </div>
                    </div>

                    <footer className="login-footer">
                        © 2026 SkyCorp HRM Inc. All rights reserved.
                    </footer>
                </div>
            </div>
        </div>
    );
}
