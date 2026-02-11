import axiosInstance from "../../../utils/axiosConfig.ts";
import type {UserAuth} from "../../../types/user.types.ts";

export interface InviteUsersRequest {
    emails: string[];
}

export interface InviteUsersResult {
    PENDING: string[];
    ACTIVE: string[];
    INACTIVE: string[];
}

export interface ResendInviteRequest {
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    token: string;
}

export const userApi = {
    // Get all users
    async findAll(): Promise<UserAuth[]> {
        const response = await axiosInstance.get('/user');
        return response.data;
    },

    // Get user by ID
    async findById(id: string): Promise<UserAuth | null> {
        const response = await axiosInstance.get(`/user/${id}`);
        return response.data;
    },

    // Get user by email
    async findByEmail(email: string): Promise<UserAuth | null> {
        const response = await axiosInstance.get(`/user/email/${email}`);
        return response.data;
    },

    // Update user
    async update(id: string, user: Partial<UserAuth>): Promise<{ success: boolean }> {
        const response = await axiosInstance.put(`/user/${id}`, user);
        return response.data;
    },

    // Delete user
    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/user/${id}`);
    },

    // Invite users
    async inviteUsers(data: InviteUsersRequest): Promise<{
        success: boolean;
        data: InviteUsersResult;
    }> {
        const response = await axiosInstance.post('/user/invite', data);
        return response.data;
    },

    // Resend invite
    async resendInvite(data: ResendInviteRequest): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await axiosInstance.post('/user/resend-invite', data);
        return response.data;
    },

    // Verify email
    async verifyEmail(data: VerifyEmailRequest): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await axiosInstance.post('/user/verify-email', data);
        return response.data;
    },
};