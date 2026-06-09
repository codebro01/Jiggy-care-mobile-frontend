import messaging from '@react-native-firebase/messaging'
import api from './api.service'
import { useAuthStore } from '../stores/authStore'


export async function registerFcmToken() {
  try {
    const accessToken = useAuthStore.getState().tokens?.accessToken
    if (!accessToken) return

    const authStatus = await messaging().requestPermission()
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL

    if (!enabled) return

    const token = await messaging().getToken()

    await api.patch(
      '/users/fcm-token',
      { token },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    console.log('FCM token saved')
  } catch (error) {
    console.error('Failed to register FCM token:', error)
  }
}
