/**
 * Jiggy Care Mobile - Appointments Store
 * Manages appointments state
 */

import { create } from 'zustand';
import { Appointment, Patient, User } from '../types';
import {appointmentService} from '../services/appointment.service';

interface AppointmentsState {
    appointments: Appointment[];
    selectedAppointment: Appointment | null;
    filter: 'upcoming' | 'completed' | 'cancelled' | 'in_progress' | 'no_show' | 'pending_confirmation'  | 'no_show';
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
            const response = await appointmentService.allAppointments();
            set({ appointments: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load appointments',
                isLoading: false
            });
        }
    },
    getFilteredAppointments: () => {
        const { appointments, filter } = get();

        if (filter === 'completed') {
            return appointments.filter(apt => apt.status === 'completed');
        }

        if (filter === 'cancelled') {
            return appointments.filter(apt => apt.status === 'cancelled');
        }

        if (filter === 'upcoming') {
            return appointments.filter(apt =>
                apt.status !== 'completed' && apt.status !== 'cancelled' && apt.status !== 'in_progress' && apt.status !== 'no_show' && apt.status !== 'pending_confirmation'
            );
        }
    
        if (filter === 'in_progress') {
            return appointments.filter(apt => apt.status === 'in_progress');
        }

        if (filter === 'no_show') {
            return appointments.filter(apt => apt.status === 'no_show');
        }

        if (filter === 'pending_confirmation') {
            return appointments.filter(apt => apt.status === 'pending_confirmation');
        }

        return appointments;
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
