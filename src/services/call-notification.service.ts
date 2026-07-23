import notifee, {
  AndroidImportance,
  AndroidCategory,
  EventType,
} from '@notifee/react-native'
import { AppState, Platform } from 'react-native'

const CHANNEL_ID = 'jiggy_care_calls'

class CallNotificationService {
  private pendingCallData: any = null
  private currentNotificationId: string | null = null

  async setup() {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    })
    console.log('✅ Notifee call channel created')
  }

  async displayIncomingCall(
    callerName: string,
    callType: 'video' | 'audio',
    callData: any,
  ) {
    this.pendingCallData = { ...callData, callType }

    const notificationId = await notifee.displayNotification({
      id: 'incoming_call',
      title: `Incoming ${callType} call`,
      body: callerName,
      data: this.pendingCallData,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH,
        fullScreenAction: { id: 'default', launchActivity: 'default' }, // wakes screen
        actions: [
          {
            title: '✅ Answer',
            pressAction: { id: 'answer', launchActivity: 'default' },
          },
          { title: '❌ Decline', pressAction: { id: 'decline' } },
        ],
        ongoing: true,
        autoCancel: false,
      },
    })

    this.currentNotificationId = notificationId
    console.log(`📱 Displaying call notification for ${callerName}`)
    return notificationId
  }

  async cancelCallNotification() {
    await notifee.cancelNotification('incoming_call')
    this.currentNotificationId = null
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
