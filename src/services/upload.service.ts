import api from './api.service';

export const uploadService = {

    uploadFile: async (
        file: FormData
    ) => {
        try {
            const response = await api.post<any>('/upload/image', file, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            return response;
        } catch (error) {
            throw error;
        }
    },

    uploadChatFile: async (
        file: FormData
    ) => {
        try {
            const response = await api.post<any>('/upload/file', file, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            return response;
        } catch (error) {
            throw error;
        }
    },
}