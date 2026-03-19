
/**
 * Jiggy Care Mobile - Healthcare Consultant App
 * Main entry point with providers and font loading
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
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

  useEffect(() => {

    async function prepare() {
      try {
            console.log('1. Starting prepare...');

        initializeOneSignal();
    console.log('2. OneSignal done...');


// When user taps notification (app backgrounded or killed)
        OneSignal.Notifications.addEventListener('click', (event) => {
          const data = event.notification.additionalData as any;

          if (data?.category === 'Call') {
            // Small delay to ensure navigator is ready
            setTimeout(() => {
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: data.conversationId,
                callType: data.callType,
                isIncoming: true,
              });
            }, 1000);
          }
        });

        // ✅ When notification arrives while app is in foreground
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          const data = event.notification.additionalData as any;

          if (data?.category === 'Call') {
            // Suppress the banner, show your own call UI instead
            event.preventDefault();
            navigationRef.current?.navigate('ChatScreen', {
              conversationId: data.conversationId,
              callType: data.callType,
              isIncoming: true,
            });
          } else {
            // Show normally for messages and other notifications
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
