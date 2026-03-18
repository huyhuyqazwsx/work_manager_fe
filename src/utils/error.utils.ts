import { AppError } from "../types/enum/enum";

export const parseBackendError = (err: any, fallbackMessage: string = "An error occurred"): string => {
    const data = err?.response?.data;
    if (data?.errorCode) {
        if (data.errorCode === AppError.VALIDATION_ERROR && Array.isArray(data.details) && data.details.length > 0) {
            const detailsStr = data.details.map((d: any) => `${d.field}: ${d.errors.join(", ")}`).join(" | ");
            return `${data.message}: ${detailsStr}`;
        }
        return data.message || `Error: ${data.errorCode}`;
    }
    return data?.message || err?.message || fallbackMessage;
};
