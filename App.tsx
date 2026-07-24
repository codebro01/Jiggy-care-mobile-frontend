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
import { useChatStore } from '@/stores/chatStore'
import messaging from '@react-native-firebase/messaging'
import { callNotificationService } from '@/services/call-notification.service'
import { authService } from '@/services/auth.service'
import {
  reportIncomingCall,
  reportCallEnded,
  getActiveCallSession,
  registerVoIPPush,
  addCallAnsweredListener,
  addCallEndedListener,
  fulfillIncomingCallConnected,
  endCall,
} from 'expo-callkit-telecom'

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
        console.log('User is logged out. Attempting to refresh token for incoming call...')
        await authService.refreshToken()
      } catch (err) {
        console.warn('Failed to refresh token in background:', err)
      }
    }

    // Report incoming call natively via expo-callkit-telecom
    try {
      await reportIncomingCall({
        eventId: data.conversationId || 'incoming-call-' + Date.now(),
        serverCallId: data.conversationId,
        hasVideo: callType === 'video',
        caller: {
          id: data.callerUserId,
          displayName: data.callerName || 'Patient',
        },
        metadata: {
          conversationId: data.conversationId,
          bookingId: data.bookingId,
          fromUserId: data.callerUserId,
          callType: callType,
        }
      })
      console.log('📞 expo-callkit-telecom: Incoming call reported successfully in background')
    } catch (err) {
      console.error('📞 expo-callkit-telecom: Failed to report incoming call:', err)
    }
  }

  // Dismiss the incoming call notification and stop ringtone when call ends or is cancelled by caller
  const reason = data?.reason
  if (type === 'call_ended' || type === 'call_cancelled' || reason === 'cancelled' || reason === 'ended') {
    console.log(
      '📵 Call ended/cancelled in background — ending session in expo-callkit-telecom',
    )
    try {
      const session = await getActiveCallSession()
      if (session) {
        await reportCallEnded(session.id, 'remoteEnded')
      }
    } catch (err) {
      console.warn('Failed to end call session in background:', err)
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
    let subAnswered: any = null
    let subEnded: any = null

    async function prepare() {
      try {
        console.log('1. Starting prepare...')

        try {
          registerVoIPPush()
          console.log('📞 expo-callkit-telecom: VoIP Push registered')
        } catch (err) {
          console.warn('Failed to register VoIP push:', err)
        }

        // Clean up stale native call sessions caused by hot-reloads
        try {
          const session = await getActiveCallSession()
          if (session && useCallStore.getState().status === 'idle') {
            console.log('🧹 Cleaning up stale native call session on boot:', session.id)
            await endCall(session.id)
          }
        } catch (e) {
          console.warn('Failed to cleanup stale call session:', e)
        }

        // Clean up stale Notifee notifications from previous versions
        try {
          const notifee = require('@notifee/react-native').default
          await notifee.cancelAllNotifications()
        } catch (e) {
          // ignore
        }

        subAnswered = addCallAnsweredListener(async (event) => {
          console.log('📞 expo-callkit-telecom: Native call answered, event:', event)
          try {
            const session = await getActiveCallSession()
            const metadata = session?.incomingCallEvent?.metadata as any
            if (metadata) {
              // Ensure socket is connected so we can notify the backend that we accepted
              const chatStoreState = useChatStore.getState()
              if (!chatStoreState.isSocketConnected) {
                await chatStoreState.connectSocket().catch(e => console.warn('Socket connect failed', e))
              }

              // Immediately trigger the full-screen CallModal via the store
              // so the user sees the active call UI straight away
              setTimeout(async () => {
                const callStoreState = useCallStore.getState()
                if (callStoreState.status === 'idle') {
                  callStoreState.handleIncomingCall({
                    callType: metadata.callType || 'audio',
                    conversationId: metadata.conversationId,
                    fromUserId: metadata.fromUserId,
                  })
                }
                await callStoreState.acceptCall()
              }, 300)
            }

            // Confirm connection to the OS
            await fulfillIncomingCallConnected(event.requestId)
          } catch (err) {
            console.error('Failed to handle native call answer:', err)
          }
        })

        subEnded = addCallEndedListener(async (event) => {
          console.log('📞 expo-callkit-telecom: Native call ended/declined, event:', event)
          const callStoreState = useCallStore.getState()
          if (callStoreState.status !== 'idle') {
            callStoreState.rejectCall()
          }
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
    return () => {
      if (subAnswered) subAnswered.remove()
      if (subEnded) subEnded.remove()
    }
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
