import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeToToasts, type ToastPayload, type ToastVariant } from "./toast";
import "./toast.css";

type ToastItem = Required<Pick<ToastPayload, "id" | "message" | "variant">> & {
    createdAt: number;
    durationMs: number;
};

function iconFor(variant: ToastVariant) {
    if (variant === "success") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

export default function ToastHost() {
    const [items, setItems] = useState<ToastItem[]>([]);
    const defaultDuration = 3000;

    useEffect(() => {
        return subscribeToToasts((payload) => {
            const id = payload.id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
            const durationMs = payload.durationMs ?? defaultDuration;
            const item: ToastItem = {
                id,
                message: payload.message,
                variant: payload.variant,
                createdAt: Date.now(),
                durationMs,
            };

            setItems((prev) => [item, ...prev].slice(0, 4));
        });
    }, []);

    useEffect(() => {
        if (items.length === 0) return;
        const timers = items.map((t) =>
            window.setTimeout(() => {
                setItems((prev) => prev.filter((x) => x.id !== t.id));
            }, t.durationMs),
        );
        return () => timers.forEach((id) => window.clearTimeout(id));
    }, [items]);

    const content = useMemo(() => {
        if (items.length === 0) return null;
        return (
            <div className="toast-viewport" role="region" aria-label="Notifications">
                {items.map((t) => (
                    <div key={t.id} className={`toast toast--${t.variant}`} role="status" aria-live="polite">
                        <div className="toast__bar" />
                        <div className="toast__icon">{iconFor(t.variant)}</div>
                        <div className="toast__message">{t.message}</div>
                        <button
                            className="toast__close"
                            type="button"
                            aria-label="Close"
                            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        );
    }, [items]);

    if (!content) return null;
    return createPortal(content, document.body);
}

