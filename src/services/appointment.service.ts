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

   
};