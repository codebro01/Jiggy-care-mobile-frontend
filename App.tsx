
/**
 * Jiggy Care Mobile - Healthcare Consultant App
 * Main entry point with providers and font loading
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { initializeOneSignal } from '@/services/oneSignal.service';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { RootStackParamList } from './src/navigation';
import { AppNavigator } from './src/navigation';
import { OneSignal } from 'react-native-onesignal';
import { useAuthStore } from './src/stores/authStore';

// Prevent splash screen from auto-hiding

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const activeCallRef = React.useRef<string | null>(null);
  const appState = React.useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        const currentLastActive = useAuthStore.getState().lastActiveAt;
        if (currentLastActive) {
          const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
          if (Date.now() - currentLastActive > INACTIVITY_TIMEOUT) {
            useAuthStore.getState().logout();
          }
        }
      } else if (nextAppState === 'background') {
        // App has gone to the background
        useAuthStore.getState().setLastActiveAt(Date.now());
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {

    async function prepare() {
      try {
        console.log('1. Starting prepare...');

        initializeOneSignal();
        console.log('2. OneSignal done...');


        OneSignal.Notifications.addEventListener('click', (event: any) => {
          const data = event.notification.additionalData as any;

          if (data?.category === 'Call') {
            // ✅ no event.preventDefault() here — that's only for foregroundWillDisplay
            if (activeCallRef.current !== data.conversationId) {
              activeCallRef.current = data.conversationId;
              setTimeout(() => {
                navigationRef.current?.navigate('ChatScreen', {
                  conversationId: data.conversationId,
                  callType: data.callType,
                  bookingId: data.bookingId,
                  fromUserId: data.fromUserId,
                  isIncoming: true,
                });
              }, 1000);
            }
          } else if (data?.category === 'Message') {
            setTimeout(() => {
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: data.conversationId,
                bookingId: data.bookingId,
              });
            }, 1000);
          } else if (data?.category === 'FollowUp') {
            setTimeout(() => {
              navigationRef.current?.navigate('AppointmentDetail', {
                bookingId: data.bookingId,
              });
            }, 1000);
          }
        });

        // ✅ When notification arrives while app is in foreground
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          const data = event.notification.additionalData as any;

          if (data?.category === 'Call') {
            event.preventDefault(); // suppress OS banner

            // ✅ Only navigate once per unique call
            if (activeCallRef.current !== data.conversationId) {
              activeCallRef.current = data.conversationId;
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: data.conversationId,
                callType: data.callType,
                bookingId: data.bookingId,     // ✅ was missing
                fromUserId: data.fromUserId,   // ✅ was missing
                isIncoming: true,
              });
            }
          } else {
            event.notification.display();
          }
        });






        // Pre-load fonts
        await Font.loadAsync({
          Manrope_400Regular,
          Manrope_500Medium,
          Manrope_600SemiBold,
          Manrope_700Bold,
          Manrope_800ExtraBold,
        });

        console.log('3. Fonts done...');

      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once the app is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <View style={styles.container} onLayout={onLayoutRootView}>
            <AppContent />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
