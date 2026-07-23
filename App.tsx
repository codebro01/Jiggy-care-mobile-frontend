/**
 * Jiggy Care Mobile - Healthcare Consultant App
 * Main entry point with providers and font loading
 */

import React, { useCallback, useEffect, useState } from 'react'
import { createNavigationContainerRef } from '@react-navigation/native'
import { View, StyleSheet, AppState } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Font from 'expo-font'
import { initializeOneSignal } from '@/services/oneSignal.service'
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './src/theme'
import { RootStackParamList } from './src/navigation'
import { AppNavigator } from './src/navigation'
import { OneSignal } from 'react-native-onesignal'
import { useAuthStore } from './src/stores/authStore'
import { useCallStore } from '@/stores/callStore'
import messaging from '@react-native-firebase/messaging'
import {callNotificationService} from '@/services/call-notification.service'
import { authService } from '@/services/auth.service'



// Handles FCM when app is killed — must be outside any component
messaging().setBackgroundMessageHandler(async remoteMessage => {
    const type = remoteMessage.data?.type;

    if (type === 'incoming_call') {
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated) {
            try {
                console.log('User is logged out. Attempting to refresh token for incoming call...');
                await authService.refreshToken();
                // We successfully refreshed the token, the interceptor saves it to AsyncStorage.
                // We could optionally fetch user data here if needed, but for now we just 
                // re-authenticate so ChatScreen API calls don't fail immediately.
                // Depending on backend, refreshToken might return user object. 
                // For safety, we mark as authenticated temporarily if ChatScreen relies on it:
                // authState.setTokens({ accessToken: 're-hydrated', refreshToken: 're-hydrated', expiresAt: 0 }); // if needed
            } catch (err) {
                console.warn('Failed to refresh token in background:', err);
            }
        }

        await callNotificationService.setup();
        await callNotificationService.displayIncomingCall(
            remoteMessage.data.callerName as string || 'Incoming Call',
            (remoteMessage.data.callType as 'video' | 'audio') || 'video',
            {
                conversationId: remoteMessage.data.conversationId,
                bookingId: remoteMessage.data.bookingId,
                fromUserId: remoteMessage.data.callerUserId,
            }
        );
    }

    // Dismiss the incoming call notification if caller cancelled/ended/rejected the call
    if (type === 'call_ended') {
        console.log('📵 Call ended/cancelled in background — dismissing notification');
        await callNotificationService.cancelCallNotification();
    }
});

// Prevent splash screen from auto-hiding

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

SplashScreen.preventAutoHideAsync()

function AppContent() {
  const { theme } = useTheme()

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  )
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)
  const activeCallRef = React.useRef<string | null>(null)
  const appState = React.useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        const currentLastActive = useAuthStore.getState().lastActiveAt
        if (currentLastActive) {
          const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes
          if (Date.now() - currentLastActive > INACTIVITY_TIMEOUT) {
            useAuthStore.getState().inactivityLogout()
          }
        }
      } else if (nextAppState === 'background') {
        // App has gone to the background
        useAuthStore.getState().setLastActiveAt(Date.now())
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    async function prepare() {
      try {
        console.log('1. Starting prepare...')

        await callNotificationService.setup()

        callNotificationService.registerListeners({
          onAnswerCall: () => {
            const callData = callNotificationService.getPendingCallData()
            if (callData) {
              callNotificationService.clearPendingCallData()
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: callData.conversationId,
                callType: callData.callType,
                bookingId: callData.bookingId,
                fromUserId: callData.fromUserId,
                isIncoming: true,
              })
            }
          },
          onEndCall: () => {
            useCallStore.getState().rejectCall()
            callNotificationService.clearPendingCallData()
          },
        })

        initializeOneSignal()
        console.log('2. OneSignal done...')

        OneSignal.Notifications.addEventListener('click', (event: any) => {
          const data = event.notification.additionalData as any

          if (data?.category === 'Call') {
            // ✅ no event.preventDefault() here — that's only for foregroundWillDisplay
            callNotificationService.displayIncomingCall(
              data.callerName || 'Incoming Call',
              data.callType || 'video',
              {
                conversationId: data.conversationId,
                bookingId: data.bookingId,
                fromUserId: data.fromUserId,
              },
            )
          } else if (data?.category === 'Message') {
            setTimeout(() => {
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: data.conversationId,
                bookingId: data.bookingId,
              })
            }, 1000)
          } else if (data?.category === 'FollowUp') {
            setTimeout(() => {
              navigationRef.current?.navigate('AppointmentDetail', {
                bookingId: data.bookingId,
              })
            }, 1000)
          }
        })

        // ✅ When notification arrives while app is in foreground
        OneSignal.Notifications.addEventListener(
          'foregroundWillDisplay',
          (event: any) => {
            const data = event.notification.additionalData as any

            if (data?.category === 'Call') {
              event.preventDefault() // suppress OS banner

              callNotificationService.displayIncomingCall(
                data.callerName || 'Incoming Call',
                data.callType || 'video',
                {
                  conversationId: data.conversationId,
                  bookingId: data.bookingId,
                  fromUserId: data.fromUserId,
                },
              )
            } else {
              event.notification.display()
            }
          },
        )

        // Pre-load fonts
        await Font.loadAsync({
          Manrope_400Regular,
          Manrope_500Medium,
          Manrope_600SemiBold,
          Manrope_700Bold,
          Manrope_800ExtraBold,
        })

        console.log('3. Fonts done...')
      } catch (e) {
        console.warn('Error loading fonts:', e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once the app is ready
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return null
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
