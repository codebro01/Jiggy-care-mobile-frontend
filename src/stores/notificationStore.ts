import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => n.status === 'unread').length
    }),
    addNotification: (notification) => set((state) => {
        const newNotifications = [notification, ...state.notifications];
        return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => n.status === 'unread').length
        };
    }),
    markAsRead: (id) => set((state) => {
        const newNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, status: 'read' } : n
        );
        return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => n.status === 'unread').length
        };
    }),
    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, status: 'read' })),
        unreadCount: 0
    })),
}));
