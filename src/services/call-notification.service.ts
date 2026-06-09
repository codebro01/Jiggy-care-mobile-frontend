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

  registerListeners(callbacks: {
    onAnswerCall: () => void
    onEndCall: () => void
  }) {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (detail.notification?.id !== 'incoming_call') return

      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === 'answer'
      ) {
        console.log('✅ User answered call from notification')
        this.cancelCallNotification()
        callbacks.onAnswerCall()
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
