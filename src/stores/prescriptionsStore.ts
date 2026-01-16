import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Prescription } from '../types';

interface PrescriptionsState {
    prescriptions: Prescription[];
    setPrescriptions: (prescriptions: Prescription[]) => void;
    addPrescriptions: (prescriptions: Prescription[]) => void;
}

export const usePrescriptionsStore = create(persist<PrescriptionsState>(
    (set, get) => ({
        prescriptions: [],
        setPrescriptions: (prescriptions) => set({ prescriptions }),
        addPrescriptions: (newPrescriptions) => set((state) => ({
            prescriptions: [...state.prescriptions, ...newPrescriptions]
        })),
        getPrescriptions: () => get().prescriptions,
    }),
    {
        name: 'prescriptions-storage',
        storage: createJSONStorage(() => localStorage),
    }
));
