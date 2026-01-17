import EventSource, { EventSourceListener } from 'react-native-sse';
import api, { tokenManager, BASE_URL } from './api.service';

export const notificationService = {
    notificationStream: async (listener: EventSourceListener) => {
        try {
            const token = await tokenManager.getAccessToken();
            // Using /notification/stream as implied by user request context
            const es = new EventSource(`${BASE_URL}/notification/stream`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-client-type': 'mobile'
                }
            });

            es.addEventListener('open', () => console.log('SSE connection opened'));
            es.addEventListener('message', listener);
            es.addEventListener('error', (err: any) => console.error('SSE connection error:', err));

            return es;
        } catch (error) {
            console.error('Error initiating SSE:', error);
            throw error;
        }
    },

    getNotifications: async () => {
        try {
            const response = await api.get<any>('/notification/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
};