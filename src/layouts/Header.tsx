import { Link } from "react-router-dom";

export function Header() {
    return (
        <header
            style={{
                height: 60,
                background: "#0d6efd",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                justifyContent: "space-between",
            }}
        >
            <h3 style={{ margin: 0 }}>My App</h3>

            <nav style={{ display: "flex", gap: 16 }}>
                <Link to="/" style={{ color: "#fff" }}>Home</Link>
                <Link to="/about" style={{ color: "#fff" }}>About</Link>
                <Link to="/login" style={{ color: "#fff" }}>Login</Link>
            </nav>
        </header>
    );
}
