import api, { tokenManager } from './api.service';
import { User } from '../types';

export const specialityService = {

    getSpecialities: async () => {
        try {
            const response = await api.get<any>('/speciality');
            return response;
        } catch (error) {
            throw error;
        }
    }
}