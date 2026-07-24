import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native'
import { AppState, Platform } from 'react-native'

const CHANNEL_ID = 'jiggy_care_calls_v3' // bumped to force fresh channel with max priority & visibility

class CallNotificationService {
  private pendingCallData: any = null
  private currentNotificationId: string | null = null

  async setup() {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      sound: 'incoming_call', // references android/app/src/main/res/raw/incoming_call.aac
      lights: true,
      lightColor: '#10B981',
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
    })
    console.log('✅ Notifee call channel created with max priority & public visibility')
  }

  async displayIncomingCall(
    callerName: string,
    callType: 'video' | 'audio',
    callData: any,
  ) {
    this.pendingCallData = { ...callData, callType }

    // Show a full-screen intent notification that wakes the device and launches
    // the app. The actual Accept/Decline UI is handled by the React Native CallModal.
    const notificationId = await notifee.displayNotification({
      id: 'incoming_call',
      title: `Incoming ${callType === 'video' ? '📹 Video' : '📞 Audio'} Call`,
      body: `${callerName} is calling...`,
      data: this.pendingCallData,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'incoming_call',
        lightUpScreen: true,
        // Full screen action wakes the screen and opens the app when device is locked/idle
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: '📞 Answer',
            pressAction: { id: 'answer', launchActivity: 'default' },
          },
          {
            title: '❌ Decline',
            pressAction: { id: 'decline' },
          },
        ],
      },
    })

    this.currentNotificationId = notificationId
    console.log(`📱 Displaying full-screen call notification for ${callerName}`)
    // Note: ringtone is started by callStore.handleIncomingCall() in foreground,
    // and by the Notifee channel sound in background/killed state.
    return notificationId
  }

  async cancelCallNotification() {
    await notifee.cancelNotification('incoming_call')
    this.currentNotificationId = null
    // Note: ringtone is stopped by callStore.reset() — do not call ringService here
    // because this method may be called from headless background context where expo-av is unavailable.
  }

  reportConnectedCall() {
    this.cancelCallNotification()
  }

  reportEndCall() {
    this.cancelCallNotification()
  }

  getPendingCallData() {
    return this.pendingCallData
  }

  clearPendingCallData() {
    this.pendingCallData = null
  }

  async registerListeners(callbacks: {
    onAnswerCall: (data?: any) => void
    onEndCall: () => void
  }) {
    // 1. Check if the app was launched by clicking a notification
    const initialNotification = await notifee.getInitialNotification()
    if (initialNotification?.notification.id === 'incoming_call') {
      const { pressAction, notification } = initialNotification
      if (pressAction?.id === 'answer' || pressAction?.id === 'default') {
        console.log('✅ User answered call from initial notification (App was dead/background)')
        this.cancelCallNotification()
        callbacks.onAnswerCall(notification.data)
      } else if (pressAction?.id === 'decline') {
        console.log('🔴 User declined call from initial notification')
        this.cancelCallNotification()
        callbacks.onEndCall()
      }
    }

    // 2. Listen for events while the app is in foreground
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (detail.notification?.id !== 'incoming_call') return

      if (
        type === EventType.ACTION_PRESS &&
        (detail.pressAction?.id === 'answer' || detail.pressAction?.id === 'default')
      ) {
        console.log('✅ User answered call from notification (Foreground)')
        this.cancelCallNotification()
        callbacks.onAnswerCall(detail.notification?.data)
      }

      if (
        (type === EventType.ACTION_PRESS &&
          detail.pressAction?.id === 'decline') ||
        type === EventType.DISMISSED
      ) {
        console.log('🔴 User declined call from notification')
        this.cancelCallNotification()
        callbacks.onEndCall()
      }
    })
  }

  removeListeners() {
    // returned unsubscribe from registerListeners() handles this
  }
}

export const callNotificationService = new CallNotificationService()
