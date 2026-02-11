export function Footer() {
    return (
        <footer
            style={{
                height: 50,
                background: "#f1f3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "#666",
            }}
        >
            © {new Date().getFullYear()} My App. All rights reserved.
        </footer>
    );
}
