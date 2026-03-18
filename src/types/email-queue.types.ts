export interface EmailQueue {
    id: string;
    emailSend: string | null;
    emailCC: string[];
    type: string;
    payload: any; // Simplified for frontend (Prisma.JsonValue equivalent)
    createdAt: string;
}
