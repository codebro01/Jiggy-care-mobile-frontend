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
import { callNotificationService } from '@/services/call-notification.service'
import { authService } from '@/services/auth.service'
import InCallManager from 'react-native-incall-manager'

// Handles FCM when app is killed — must be outside any component
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const type = remoteMessage.data?.type
  const data = remoteMessage.data

  if (type === 'incoming_call') {
    if (!data) {
      console.warn('Incoming call message missing data payload')
      return
    }

    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated) {
      try {
        console.log(
          'User is logged out. Attempting to refresh token for incoming call...',
        )
        await authService.refreshToken()
      } catch (err) {
        console.warn('Failed to refresh token in background:', err)
      }
    }

    // Show the Notifee full-screen / heads-up notification
    await callNotificationService.setup()

    const callType = data.callType === 'audio' ? 'audio' : 'video'

    await callNotificationService.displayIncomingCall(
      (data.callerName as string) || 'Incoming Call',
      callType,
      {
        conversationId: data.conversationId,
        bookingId: data.bookingId,
        fromUserId: data.callerUserId,
      },
    )

    // Start looping ringtone via InCallManager.
    // '_BUNDLE_' maps to res/raw/incallmanager_ringtone.aac (our custom sound).
    // InCallManager is a native Android AudioManager module — works in headless JS.
    try {
      InCallManager.startRingtone('_BUNDLE_')
      console.log('🔔 InCallManager ringtone started in background (incallmanager_ringtone.aac)')
    } catch (err) {
      console.warn('InCallManager.startRingtone failed in background:', err)
    }
  }

  // Dismiss the incoming call notification and stop ringtone when call ends or is cancelled by caller
  const reason = data?.reason
  if (type === 'call_ended' || type === 'call_cancelled' || reason === 'cancelled' || reason === 'ended') {
    console.log(
      '📵 Call ended/cancelled in background — dismissing notification & stopping ringtone',
    )
    await callNotificationService.cancelCallNotification()
    try {
      InCallManager.stopRingtone()
    } catch (err) {
      console.warn('InCallManager.stopRingtone failed:', err)
    }
  }
})

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
          onAnswerCall: (data?: any) => {
            // Use data from the notification if available, otherwise fall back to pendingCallData
            const callData =
              data || callNotificationService.getPendingCallData()
            if (callData) {
              callNotificationService.clearPendingCallData()

              // Stop the background InCallManager ringtone — ringService will take over
              try {
                InCallManager.stopRingtone()
              } catch (_) {}

              // Navigate to ChatScreen first so the socket connects and Agora can join
              navigationRef.current?.navigate('ChatScreen', {
                conversationId: callData.conversationId,
                callType: callData.callType,
                bookingId: callData.bookingId,
                fromUserId: callData.fromUserId,
                isIncoming: true,
              })

              // Immediately trigger the full-screen CallModal via the store
              // so the user sees the incoming call UI straight away
              setTimeout(() => {
                const callStoreState = useCallStore.getState()
                if (callStoreState.status === 'idle') {
                  callStoreState.handleIncomingCall({
                    callType: callData.callType || 'audio',
                    conversationId: callData.conversationId,
                    fromUserId: callData.fromUserId,
                  })
                }
              }, 500) // brief delay lets navigation settle
            }
          },
          onEndCall: () => {
            // Stop background InCallManager ringtone too
            try {
              InCallManager.stopRingtone()
            } catch (_) {}
            useCallStore.getState().rejectCall()
            callNotificationService.clearPendingCallData()
          },
        })

        initializeOneSignal()
        console.log('2. OneSignal done...')

        OneSignal.Notifications.addEventListener('click', (event: any) => {
          const data = event.notification.additionalData as any

          if (data?.category === 'Call') {
            console.log(
              '📱 OneSignal call notification clicked, opening full-screen call UI directly...',
            )
            const conversationId = data.conversationId
            const bookingId = data.bookingId
            const fromUserId = data.fromUserId
            const callType = data.callType || 'video'

            if (conversationId && fromUserId) {
              navigationRef.current?.navigate('ChatScreen', {
                conversationId,
                callType,
                bookingId,
                fromUserId,
                isIncoming: true,
              })

              setTimeout(() => {
                const callStoreState = useCallStore.getState()
                if (callStoreState.status === 'idle') {
                  callStoreState.handleIncomingCall({
                    callType,
                    conversationId,
                    fromUserId,
                  })
                }
              }, 300)
            }
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
              event.preventDefault() // suppress OS notification banner completely
              console.log(
                '📱 OneSignal foreground call received, opening CallModal directly...',
              )

              if (data.conversationId && data.fromUserId) {
                const callStoreState = useCallStore.getState()
                if (callStoreState.status === 'idle') {
                  callStoreState.handleIncomingCall({
                    callType: data.callType || 'video',
                    conversationId: data.conversationId,
                    fromUserId: data.fromUserId,
                  })
                }
              }
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
