import api, { tokenManager } from './api.service';
import { User } from '../types';

export const userService = {

    updateProfile: async (
        data: Partial<User>
    ) => {
        try {
            const response = await api.patch<any>('/users/update/consultant', data);

            // Tokens are automatically saved in the response interceptor
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateProfilePicture: async (
        data: FormData | { dp: string }
    ) => {
        try {
            const response = await api.patch<any>('/users/profile-pic/update', data);

            // Tokens are automatically saved in the response interceptor
            return response;
        } catch (error) {
            throw error;
        }
    },

   
}