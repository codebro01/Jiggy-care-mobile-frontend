/**
 * Jiggy Care Mobile - UI Store
 * Manages UI state like theme, loading, etc.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../theme';

interface UIState {
    themeMode: ThemeMode;
    isGlobalLoading: boolean;
    toastMessage: string | null;
    toastType: 'success' | 'error' | 'warning' | 'info' | null;

    // Actions
    setThemeMode: (mode: ThemeMode) => void;
    setGlobalLoading: (loading: boolean) => void;
    showToast: (message: string, type: UIState['toastType']) => void;
    hideToast: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            themeMode: 'auto',
            isGlobalLoading: false,
            toastMessage: null,
            toastType: null,

            setThemeMode: (mode) => set({ themeMode: mode }),

            setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

            showToast: (message, type) => set({ toastMessage: message, toastType: type }),

            hideToast: () => set({ toastMessage: null, toastType: null }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ themeMode: state.themeMode }),
        }
    )
);
