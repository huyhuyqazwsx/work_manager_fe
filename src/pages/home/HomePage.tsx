import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./home.css";

export default function HomePage() {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const isAuth = localStorage.getItem("FAKE_AUTH");

        if (!isAuth) {
            navigate("/login", { replace: true });
            return;
        }

        setUserEmail("user@example.com");
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("FAKE_AUTH");
        sessionStorage.clear();
        navigate("/login", { replace: true });
    };

    return (
        <div className="home-root">
            <header className="home-header">
                <h1>Dashboard</h1>

                <div className="user-info">
                    <span>{userEmail}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="home-main">
                <section className="status-card">
                    <h2>🎉 Email Verified Successfully!</h2>
                    <p>Your account is now active and ready to use.</p>
                </section>

                <section className="card-grid">
                    <div className="card">
                        <h3>📊 Dashboard</h3>
                        <p>View your statistics and reports</p>
                    </div>

                    <div className="card">
                        <h3>👥 Users</h3>
                        <p>Manage user accounts</p>
                    </div>

                    <div className="card">
                        <h3>⚙️ Settings</h3>
                        <p>Configure your preferences</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
