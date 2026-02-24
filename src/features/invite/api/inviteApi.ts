import axiosInstance from "../../../utils/axiosConfig";
import type {InviteForm} from "../../../types/invite.type.ts";

export const inviteApi = {

    downloadTemplate: async (): Promise<Blob> => {
        const response = await axiosInstance.get("/invites/template", {
            responseType: "blob",
        });
        return response.data;
    },

    importFromExcel: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axiosInstance.post(
            "/invites/import",
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    },

    createInvite: async (data: InviteForm) => {
        const response = await axiosInstance.post("/invites", data);
        return response.data;
    },
};