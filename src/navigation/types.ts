/**
 * Jiggy Care Mobile - Navigation Types
 */

import { Appointment, Patient } from '../types';

// Auth Stack
export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
};

// Home Stack
export type HomeStackParamList = {
    HomeScreen: undefined;
    Notifications: undefined;
};

// Appointments Stack
export type AppointmentsStackParamList = {
    AppointmentsList: undefined;
    AppointmentDetail: { appointment: Appointment };
    Chat: { appointment: Appointment };
};

// Prescriptions Stack
export type PrescriptionsStackParamList = {
    PrescriptionsList: undefined;
    CreatePrescription: { patient?: Patient; appointmentId?: string };
    PrescriptionDetail: { prescriptionId: string };
};

// Profile Stack
export type ProfileStackParamList = {
    ProfileMain: undefined;
    EditProfile: undefined;
    NotificationSettings: undefined;
    AppearanceSettings: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
    Home: undefined;
    Appointments: undefined;
    Prescriptions: undefined;
    Profile: undefined;
};

// Root Navigator
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};
