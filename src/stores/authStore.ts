/**
 * Jiggy Care Mobile - Authentication Store
 * Manages user authentication state using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, UserSignupData } from '../types';
import { registerFcmToken } from '../services/fcm.service'
import { authService } from '../services/auth.service';


interface AuthState {
    userSignupData?: UserSignupData | null;
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    lastActiveAt: number | null;

    // Actions
    setUserSignupData: (userSignupData: UserSignupData ) => void;
    setUser: (user: User) => void;
    setTokens: (tokens: AuthTokens) => void;
    login: (email: string, password: string) => Promise<void>;
    googleSignIn: () => Promise<void>;
    logout: () => void;
    inactivityLogout: () => void;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
    setLastActiveAt: (time: number | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastActiveAt: null,
        setUserSignupData: (userSignupData) => set({ userSignupData }),
        setUser: (user) => set({ user, isAuthenticated: true }),

        setTokens: (tokens) => set({ tokens }),

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(email, password);

                    if (response && response.success) {
                        const user = response.data.user;
                        const tokens: AuthTokens = {
                            accessToken: '', // handled by api service interceptor
                            refreshToken: '', // handled by api service interceptor
                            expiresAt: Date.now() + 24 * 60 * 60 * 1000, 
                        };

                        set({
                            user: user as User,
                            tokens,
                            isAuthenticated: true,
                            isLoading: false
                        });

                        await registerFcmToken();
                    } else {
                        throw new Error(response.message || 'Login failed');
                    }
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
                        id: '904b883f-f802-431b-aade-bed855593705',
                        email: 'samsondamilola.99@gmail.com',
                        fullName: 'Chicken',
                        avatar: null,
                        role: 'consultant',
                        phone: null,
                        emailVerified: true,
                        dateJoined: '2026-01-09T12:09:49.238Z',
                        address: 'Lagos, Nigeria',
                        dateOfBirth: null,
                        gender: null,
                        about: null,
                        availability: false,
                        certification: null,
                        speciality: null,
                        workingHours: null,
                        yrsOfExperience: null,
                        languages: null,
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

                await registerFcmToken()
            },

            logout: () => {
                set({
                    user: null,
                    tokens: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            inactivityLogout: () => {
                set({
                    isAuthenticated: false,
                });
            },

        clearError: () => set({ error: null }),

        setLoading: (loading) => set({ isLoading: loading }),
        
        setLastActiveAt: (time) => set({ lastActiveAt: time }),
    }),
    {
        name: 'auth-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
    )
);
