import api, { tokenManager } from './api.service';



export const appointmentService = {
    

    upcomingAppointments: async () => {
        try {
            const response = await api.get<any>('/booking/consultant/upcoming');
            return response;
        } catch (error) {
            throw error;
        }
    },
    markNoShow: async (bookingId: string) => {
        try {
            const response = await api.patch<any>(`/booking/${ bookingId }/consultant/mark-no-show`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    completeAppointment: async (bookingId: string, notes: string) => {
        try {
            const response = await api.patch<any>(`/booking/${bookingId}/consultant/completed`, {
                notes
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
    // startAppointment: async (bookingId: string) => {
    //     try {
    //         const response = await api.patch<any>(`/booking/${bookingId}/consultant/start`);
    //         return response;
    //     } catch (error) {
    //         throw error;
    //     }
    // },
    allAppointments: async () => {
        try {
            const response = await api.get<any>('/booking/consultant/all');
            return response;
        } catch (error) {
            throw error;
        }
    },

   
};