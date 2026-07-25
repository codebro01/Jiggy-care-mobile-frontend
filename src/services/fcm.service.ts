import messaging from '@react-native-firebase/messaging'
import api, { tokenManager } from './api.service'
import { useAuthStore } from '../stores/authStore'


export async function registerFcmToken() {
  console.log('[FCM_TRACE] Starting FCM token registration...')
  try {
    const accessToken = await tokenManager.getAccessToken()
    if (!accessToken) {
      console.log('[FCM_TRACE] ❌ No access token found, user is not logged in.')
      return
    }

    console.log('[FCM_TRACE] Requesting notification permissions...')
    const authStatus = await messaging().requestPermission()
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL

    if (!enabled) {
      console.log('[FCM_TRACE] ❌ Permission not granted by user.')
      return
    }

    console.log('[FCM_TRACE] Fetching FCM token from Firebase...')
    const token = await messaging().getToken()
    console.log('[FCM_TRACE] ✅ Fetched FCM token:', token)

    console.log('[FCM_TRACE] Sending token to backend via PATCH /users/fcm-token...')
    const response = await api.patch(
      '/users/fcm-token',
      { token },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    console.log('[FCM_TRACE] ✅ Backend responded with status:', response.status)
    console.log('[FCM_TRACE] ✅ Backend response data:', response.data)
    console.log('FCM token saved')
  } catch (error: any) {
    console.error('[FCM_TRACE] ❌ Failed to register FCM token:', error?.response?.data || error)
  }
}
