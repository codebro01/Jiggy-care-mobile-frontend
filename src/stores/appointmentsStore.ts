/**
 * Jiggy Care Mobile - Appointments Store
 * Manages appointments state
 */

import { create } from 'zustand';
import { Appointment, Patient, User } from '../types';

interface AppointmentsState {
    appointments: Appointment[];
    selectedAppointment: Appointment | null;
    filter: 'upcoming' | 'completed' | 'cancelled' | 'all';
    isLoading: boolean;
    error: string | null;

    // Actions
    setAppointments: (appointments: Appointment[]) => void;
    setSelectedAppointment: (appointment: Appointment | null) => void;
    setFilter: (filter: AppointmentsState['filter']) => void;
    loadAppointments: () => Promise<void>;
    getFilteredAppointments: () => Appointment[];
    getUpcomingCount: () => number;
    getCompletedCount: () => number;
    clearError: () => void;
}

// Mock data
const mockPatient: Patient = {
    id: 'p1',
    firstName: 'Victor',
    lastName: 'Damilola',
    email: 'victor@example.com',
    phone: '+234 801 234 5678',
    gender: 'male',
    dateOfBirth: '1990-05-15',
};

const mockConsultant: Partial<User> = {
    id: 'c1',
    email: 'doctor@example.com',
    fullName: 'Dr. John',
    role: 'consultant',
    speciality: 'General Practitioner',
yrsOfExperience: 25, 
    dateJoined: new Date().toISOString(),
};

// const mockAppointments: Appointment[] = [
//     {
//         appointmentId: 'a1',
//         patientId: 'p1',
//         consultantId: 'c1',
//         date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
//         time: '10:00',
//         duration: 30,
//         status: 'confirmed',
//         type: 'video',
//         notes: 'Follow-up consultation',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//     },
//     {
//         appointmentId: 'a2',
//         patientId: { ...mockPatient, ointappointmentId: 'p2', firstName: 'Sarah', lastName: 'Williams' },
//         consultant: mockConsultant,
//         date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
//         time: '14:30',
//         duration: 45,
//         status: 'pending',
//         type: 'chat',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//     },
//     {
//         appointmentId: 'a3',
//         patientId: { ...mockPatient, ointappointmentId: 'p3', firstName: 'Michael', lastName: 'Brown' },
//         consultant: mockConsultant,
//         date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
//         time: '09:00',
//         duration: 30,
//         status: 'completed',
//         type: 'video',
//         notes: 'Initial consultation - prescribed medication',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//     },
//     {
//         appointmentId: 'a4',
//         patientId: { ...mockPatient, ointappointmentId: 'p4', firstName: 'Emma', lastName: 'Davis' },
//         consultant: mockConsultant,
//         date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
//         time: '11:00',
//         duration: 30,
//         status: 'cancelled',
//         type: 'audio',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//     },
// ];

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
    appointments: [],
    selectedAppointment: null,
    filter: 'upcoming',
    isLoading: false,
    error: null,

    setAppointments: (appointments) => set({ appointments }),

    setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),

    setFilter: (filter) => set({ filter }),

    loadAppointments: async () => {
        set({ isLoading: true, error: null });
        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 800));
            set({ appointments: [], isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load appointments',
                isLoading: false
            });
        }
    },

    getFilteredAppointments: () => {
        const { appointments, filter } = get();
        const now = new Date();

        switch (filter) {
            case 'upcoming':
                return appointments.filter(apt =>
                    apt.status !== 'completed' &&
                    apt.status !== 'cancelled' &&
                    new Date(apt.date) >= now
                );
            case 'completed':
                return appointments.filter(apt => apt.status === 'completed');
            case 'cancelled':
                return appointments.filter(apt => apt.status === 'cancelled');
            default:
                return appointments;
        }
    },

    getUpcomingCount: () => {
        const { appointments } = get();
        const now = new Date();
        return appointments.filter(apt =>
            apt.status !== 'completed' &&
            apt.status !== 'cancelled' &&
            new Date(apt.date) >= now
        ).length;
    },

    getCompletedCount: () => {
        const { appointments } = get();
        return appointments.filter(apt => apt.status === 'completed').length;
    },

    clearError: () => set({ error: null }),
}));
