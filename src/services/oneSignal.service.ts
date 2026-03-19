// src/services/oneSignalService.ts
import { LogLevel, OneSignal } from 'react-native-onesignal';

const EXPO_PUBLIC_ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

export const initializeOneSignal = () => {
    // Initialize
    if (!EXPO_PUBLIC_ONESIGNAL_APP_ID) {
        console.error("OneSignal App ID is missing! Check your .env file.");
        return;
    }
    // Enable verbose logging for debugging (remove in production)
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    // Initialize
    OneSignal.initialize(EXPO_PUBLIC_ONESIGNAL_APP_ID);



    // Request permission
    OneSignal.Notifications.requestPermission(true);
};

export const setupOneSignalListeners = (
    onNotificationClick?: (event: any) => void,
    onSubscriptionChange?: (subscriptionId: string) => void
) => {
    // Notification click listener
    OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('OneSignal: notification clicked:', event);
        onNotificationClick?.(event);
    });

    // Subscription change listener
    OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
        console.log('OneSignal: subscription changed:', subscription);
        if (subscription.current.id) {
            onSubscriptionChange?.(subscription.current.id);
        }
    });
};

export const loginOneSignalUser = (userId: string) => {
    OneSignal.login(userId);
};

export const logoutOneSignalUser = () => {
    OneSignal.logout();
};

export const getSubscriptionId = async (): Promise<string | null> => {
    return OneSignal.User.pushSubscription.getPushSubscriptionId()
};