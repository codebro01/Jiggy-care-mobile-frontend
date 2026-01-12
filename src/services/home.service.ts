import api, { tokenManager } from './api.service';



export const homeService = {
    

    fetchHomeData: async () => {
        try {
            const response = await api.get<any>('/dashboard/consultant');
            return response;
        } catch (error) {
            throw error;
        }
    },

   
};