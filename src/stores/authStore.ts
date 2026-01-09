/**
 * Jiggy Care Mobile - Authentication Store
 * Manages user authentication state using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, UserSignupData } from '../types';

interface AuthState {
    userSignupData?: UserSignupData | null;
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUserSignupData: (userSignupData: UserSignupData ) => void;
    setUser: (user: User) => void;
    setTokens: (tokens: AuthTokens) => void;
    login: (email: string, password: string) => Promise<void>;
    googleSignIn: () => Promise<void>;
    logout: () => void;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            setUserSignupData: (userSignupData) => set({ userSignupData }),
            setUser: (user) => set({ user, isAuthenticated: true }),

            setTokens: (tokens) => set({ tokens }),

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    // TODO: Replace with actual API call
                    // Simulating API call for now
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Mock successful login
                    const mockUser: User = {
                        id: '1',
                        email,
                        firstName: 'Dr. John',
                        lastName: 'Smith',
                        role: 'consultant',
                        specialization: 'General Practitioner',
                        rating: 4.8,
                        experience: 10,
                        languages: ['English', 'Spanish'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    const mockTokens: AuthTokens = {
                        accessToken: 'mock-access-token',
                        refreshToken: 'mock-refresh-token',
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                    };

                    set({
                        user: mockUser,
                        tokens: mockTokens,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            googleSignIn: async () => {
                set({ isLoading: true, error: null });
                try {
                    // TODO: Implement Google Sign-In
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const mockUser: User = {
                        id: '2',
                        email: 'doctor@example.com',
                        firstName: 'Dr. Sarah',
                        lastName: 'Johnson',
                        role: 'consultant',
                        specialization: 'Cardiologist',
                        rating: 4.9,
                        experience: 15,
                        languages: ['English'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    const mockTokens: AuthTokens = {
                        accessToken: 'mock-google-access-token',
                        refreshToken: 'mock-google-refresh-token',
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                    };

                    set({
                        user: mockUser,
                        tokens: mockTokens,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Google sign-in failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                set({
                    user: null,
                    tokens: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            clearError: () => set({ error: null }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
