import api, { tokenManager } from './api.service';
import { CreatePrescription, Prescription } from '../types';


export const prescriptionService = {


    createPrescription: async (data: Prescription) => {
        try {
            const response = await api.post<any>('/prescription', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    createManyPrescriptions: async (data: { patientId: string, prescriptions: CreatePrescription[]}) => {


        try {
            const response = await api.post<any>('/prescription/bulk', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    getConsultantPatients: async () => {
        try {
            const response = await api.get<any>('/consultant/patients');
            return response;
        } catch (error) {
            throw error;
        }
    },

    findAll: async () => {
        try {
            const response = await api.get<any>('/prescription');
            return response;
        } catch (error) {
            throw error;
        }
    },


};