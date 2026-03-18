export type ToastVariant = "success" | "error";

export interface ToastPayload {
    id?: string;
    variant: ToastVariant;
    message: string;
    durationMs?: number;
}

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export const toast = {
    success(message: string, opts?: { durationMs?: number }) {
        emit({ variant: "success", message, durationMs: opts?.durationMs });
    },
    error(message: string, opts?: { durationMs?: number }) {
        emit({ variant: "error", message, durationMs: opts?.durationMs });
    },
};

export function subscribeToToasts(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function emit(payload: ToastPayload) {
    listeners.forEach((l) => l(payload));
}

