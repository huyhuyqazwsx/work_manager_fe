import axiosInstance from "../../../utils/axiosConfig";
import type { UserResponse, ResendInviteRequest, VerifyEmailRequest, UpdateUserPayload, InviteUsersRequest, InviteUsersResult, UserInDepartmentDto } from "../../../types/user.types";


export const userApi = {

    // GET /user
    async findAll(): Promise<UserResponse[]> {
        const response = await axiosInstance.get("/user");
        return response.data;
    },

    // GET /user/count
    async getCountCode(): Promise<any> {
        const response = await axiosInstance.get("/user/count");
        return response.data;
    },

    // GET /user/:id
    async findById(id: string): Promise<UserResponse | null> {
        const response = await axiosInstance.get(`/user/${id}`);
        return response.data;
    },

    // GET /user/email/:email
    async findByEmail(email: string): Promise<UserResponse | null> {
        const response = await axiosInstance.get(`/user/email/${email}`);
        return response.data;
    },

    // PUT /user/:id
    async update(
        id: string,
        user: UpdateUserPayload
    ): Promise<{ success: boolean }> {
        const response = await axiosInstance.put(`/user/${id}`, user);
        return response.data;
    },

    // DELETE /user/:id
    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/user/${id}`);
    },

    // POST /user/invite
    async invite(data: InviteUsersRequest): Promise<InviteUsersResult> {
        const response = await axiosInstance.post("/user/invite", data);
        return response.data;
    },

    // POST /user/resend-invite
    async resendInvite(data: ResendInviteRequest): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await axiosInstance.post("/user/resend-invite", data);
        return response.data;
    },

    // POST /user/verify-email
    async verifyEmail(data: VerifyEmailRequest): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await axiosInstance.post("/user/verify-email", data);
        return response.data;
    },

    // GET /user/profile
    async getProfile(): Promise<UserResponse> {
        const response = await axiosInstance.get("/user/profile");
        return response.data;
    },

    // GET /user/department/:managerId/users
    async getUsersByUserOfDepartment(managerId: string): Promise<UserInDepartmentDto[]> {
        const response = await axiosInstance.get(`/user/department/${managerId}/users`);
        return response.data;
    },
};