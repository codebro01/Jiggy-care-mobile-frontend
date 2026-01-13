import api, { tokenManager } from './api.service';



export const chatService = {

    getOrCreateConversation: async (
        bookingId: string,
        consultantId: string,
        patientId: string,
    ) => {
        try {
            const response = await api.post<any>(`/chat/conversations`, {
                bookingId,
                consultantId,
                patientId,
            });
            return response;
        } catch (error) {
            throw error;
        }
    },


    sendMessages: async (
        consultantId: string,
        patientId: string,
        content: string,
        semdType: "patient" | "consultant",
    ) => {
        try {
            const response = await api.post<any>('/chat/messages', {
                consultantId,
                patientId,
                content,
                semdType,
            });

            return response;
        } catch (error) {
            throw error;
        }
    },
    loadConversations: async (
        consultantId: string,
        patientId: string,
    ) => {
        try {
            const response = await api.get<any>(`/chat/conversations?consultantId=${consultantId}&patientId=${patientId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    loadMessages: async (
        conversationId: string,
        limit: number,
        offset: number,
    ) => {
        try {
            const response = await api.get<any>(`/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    markAsRead: async (
        conversationId: string,
    ) => {
        try {
            const response = await api.get<any>(`/chat/conversations/${conversationId}/read`);
            return response;
        } catch (error) {
            throw error;
        }
    },


};