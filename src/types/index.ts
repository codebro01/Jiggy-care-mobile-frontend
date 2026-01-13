/**
 * Jiggy Care Mobile - TypeScript Type Definitions
 */

// User Types
export interface User {
    id: string;
    email: string;
    fullName: string;
    avatar?: string | null; // Maps to 'dp'
    role: 'consultant' | 'patient';
    phone?: string | null;
    emailVerified: boolean;
    dateJoined: string;

    // Common fields
    address?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;

    // Consultant-specific fields
    about?: string | null;
    availability?: boolean;
    certification?: string[] | null;
    speciality?: string | null; // Note: backend uses 'speciality' not 'specialization'
    workingHours?: Record<string, string> | null;
    yrsOfExperience?: number | null;
    languages?: string[] | null;
}
export interface UserSignupData {
    email: string;
    password: string;
    fullName: string;
}

// Authentication Types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

// Patient Types (for consultant view)
export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
}

// Appointment Types
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress' | 'no_show' | 'pending_confirmation' | 'upcoming';

export interface Appointment {
    bookingId: string;
    patientId: string;
    consultantId: string;
    patientName: string,
    date: string;
    duration: number; // in minutes
    status: AppointmentStatus;
}

// Chat Types
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    isRead: boolean;
    createdAt: string;
}

export interface Conversation {
    id: string;
    bookingId: string;
    patientId: string;
    consultantId: string;
    lastMessage?: Message;
    unreadCount: number;
    updatedAt: string;
}

// Prescription Types
export interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface Prescription {
    id: string;
    patientId: string;
    patient: Patient;
    consultantId: string;
    bookingId?: string;
    medications: Medication[];
    diagnosis?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Notification Types
export interface Notification {
    id: string;
    title: string;
    body: string;
    type: 'appointment' | 'message' | 'prescription' | 'general';
    referenceId?: string;
    read: boolean;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
