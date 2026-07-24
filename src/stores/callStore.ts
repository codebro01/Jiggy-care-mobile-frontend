import { create } from 'zustand'
import { socketService } from '@/services/socket.service'
import { agoraService } from '@/services/agora.service'
import { ringService } from '@/services/ring.service'
import { callNotificationService } from '@/services/call-notification.service'
import { CallIncomingPayload, CallType } from '@/types'
import InCallManager from 'react-native-incall-manager'
import { useAppointmentsStore } from './appointmentsStore'

type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'incoming'
  | 'connected'
  | 'ended'

interface CallState {
  status: CallStatus
  callType: CallType | null
  conversationId: string | null
  otherUserId: string | null
  otherUserName: string | null
  remoteUid: number | null
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeakerOn: boolean
  isFrontCamera: boolean
  error: string | null

  // Actions
  initiateCall: (
    toUserId: string,
    conversationId: string,
    type: CallType,
    otherUserName?: string,
  ) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  handleIncomingCall: (payload: CallIncomingPayload) => void
  handleRinging: () => void
  handleStopRinging: () => void
  handleNoAnswer: () => void
  toggleMute: () => void
  toggleVideo: () => void
  toggleSpeaker: () => void
  switchCamera: () => void
  reset: () => void
  clearError: () => void
  initialize: () => void
  cleanup: () => void
  handleCallMissed: (payload: {
    fromUserId: string
    conversationId: string
  }) => void
}

let isInitialized = false

export const useCallStore = create<CallState>()((set, get) => ({
  status: 'idle',
  callType: null,
  conversationId: null,
  otherUserId: null,
  otherUserName: null,
  remoteUid: null,
  isMuted: false,
  isVideoEnabled: true,
  isSpeakerOn: false,
  isFrontCamera: true,
  error: null,
  
  initiateCall: async (toUserId, conversationId, type, otherUserName) => {
    try {
      console.log('[CALL_TRACE][Store] 🚀 Initiating call:', { toUserId, conversationId, type });
      set({
        status: 'calling',
        callType: type,
        conversationId,
        otherUserId: toUserId,
        otherUserName: otherUserName || null,
        error: null,
      })

      // Notify backend to ring the other user
      console.log('[CALL_TRACE][Store] 📞 Notifying backend of call initiation...');
      socketService.initiateCall({
        toUserId,
        conversationId,
        callType: type,
      })

      // We don't join Agora channel until the other person accepts, 
      // or we can join now. Usually caller joins now and waits.
      console.log('[CALL_TRACE][Store] 📡 Joining Agora channel...', conversationId);
      await agoraService.joinChannel(conversationId, type === 'video')

    } catch (error: any) {
      console.error('[CALL_TRACE][Store] ❌ Failed to initiate call:', error);
      set({ error: error.message || 'Failed to initiate call' })
      setTimeout(() => get().reset(), 3000)
    }
  },

  acceptCall: async () => {
    const { otherUserId, callType, conversationId } = get()
    if (!otherUserId || !conversationId) return

    try {
      console.log('[CALL_TRACE][Store] 📞 Accepting call from:', otherUserId);
      ringService.stopRingtone()
      callNotificationService.reportConnectedCall()
      
      set({ status: 'connected', error: null })

      console.log('[CALL_TRACE][Store] 📡 Joining Agora channel...', conversationId);
      await agoraService.joinChannel(conversationId, callType === 'video')

      // Notify the other peer that we accepted
      socketService.acceptCall({ toUserId: otherUserId })

    } catch (error: any) {
      console.error('[CALL_TRACE][Store] ❌ Failed to accept call:', error);
      set({ error: error.message || 'Failed to accept call' })
      setTimeout(() => get().reset(), 3000)
    }
  },

  rejectCall: () => {
    const { otherUserId, conversationId } = get()
    console.log('[CALL_TRACE][Store] 🚫 Rejecting call...');
    if (otherUserId) {
      socketService.rejectCall({ toUserId: otherUserId, conversationId: conversationId || undefined })
    }
    get().reset()
  },

  endCall: () => {
    console.log('[CALL_TRACE][Store] 🔴 Ending call...');
    const { otherUserId, conversationId } = get()
    if (otherUserId) {
      socketService.endCall({ toUserId: otherUserId, conversationId: conversationId || undefined })
    }
    get().reset()
  },

  handleIncomingCall: (payload) => {
    console.log('[CALL_TRACE][Store] 📞 Incoming call received:', payload);
    ringService.startRingtone()

    // Try to find the name from the appointments store
    const appointments = useAppointmentsStore.getState().appointments
    const appointment = appointments.find(
      (a) =>
        a.bookingId === payload.conversationId ||
        a.patientId === payload.fromUserId,
    )

    const name = appointment ? appointment.patientName : 'Unknown'

    // Show native call screen
    callNotificationService.displayIncomingCall(name, payload.callType, {
      conversationId: payload.conversationId,
      fromUserId: payload.fromUserId,
    })

    set({
      status: 'incoming',
      callType: payload.callType,
      conversationId: payload.conversationId,
      otherUserId: payload.fromUserId,
      otherUserName: name,
      error: null,
    })
  },

  handleRinging: () => {
    console.log('[CALL_TRACE][Store] 🔔 Call is ringing on the other side');
    if (get().status === 'calling') {
      ringService.startRingback()
      set({ status: 'ringing' })
    }
  },

  handleStopRinging: () => {
    console.log('[CALL_TRACE][Store] 🔕 Stop ringing');
    ringService.stopRingtone()
    ringService.stopRingback()
    InCallManager.stopRingtone()
    InCallManager.stopRingback()
  },

  handleCallMissed: (payload) => {
    if (get().status === 'idle') {
      console.log('[CALL_TRACE][Store] ⚠️ Ignoring stale call:missed event (status is already idle)');
      return;
    }
    console.log('[CALL_TRACE][Store] 📵 Call missed from:', payload.fromUserId);
    get().reset()
  },

  handleNoAnswer: () => {
    console.log('[CALL_TRACE][Store] 📵 No answer');
    set({ error: 'No answer' })
    setTimeout(() => get().reset(), 3000)
  },

  toggleMute: () => {
    const newMuted = !get().isMuted
    agoraService.toggleAudio(!newMuted) // toggleAudio takes 'enabled' so !newMuted is correct
    set({ isMuted: newMuted })
  },

  toggleVideo: () => {
    const newVideoEnabled = !get().isVideoEnabled
    agoraService.toggleVideo(newVideoEnabled)
    set({ isVideoEnabled: newVideoEnabled })
  },

  toggleSpeaker: () => {
    const newSpeakerOn = !get().isSpeakerOn
    agoraService.toggleSpeaker(newSpeakerOn)
    set({ isSpeakerOn: newSpeakerOn })
  },

  switchCamera: () => {
    agoraService.switchCamera()
    set((state) => ({ isFrontCamera: !state.isFrontCamera }))
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    console.log('[CALL_TRACE][Store] 🎬 Initializing call event listeners');

    if (isInitialized) {
      console.log('[CALL_TRACE][Store] ⚠️ Already initialized, skipping duplicate registration');
      return
    }

    isInitialized = true
    const state = get() as any

    // Initialize Agora Engine
    await agoraService.initEngine(
      (uid) => {
        set({ remoteUid: uid })
      },
      (uid) => {
        set({ remoteUid: null })
        // Usually if remote drops, we can decide to end call or wait.
      }
    )

    // Call State Event Handlers
    const handleCallAccepted = (payload: { fromUserId: string }) => {
      console.log('[CALL_TRACE][Store] ✅ Call accepted by remote user:', payload.fromUserId);
      InCallManager.stopRingback()
      ringService.stopRingback()
      set({ status: 'connected', error: null })
    }

    const handleCallRejected = (payload: {
      fromUserId: string
      reason?: string
    }) => {
      console.log('[CALL_TRACE][Store] 🔴 Call rejected by remote user:', payload.fromUserId, payload.reason || '');
      set({ error: payload.reason || 'Call rejected' })
      setTimeout(() => get().reset(), 3000)
    }

    const handleCallEnded = (payload?: { fromUserId?: string }) => {
      const currentStatus = get().status;
      if (currentStatus === 'idle') {
        // Ignore stale call:ended events arriving when no call is active
        console.log('[CALL_TRACE][Store] ⚠️ Ignoring stale call:ended event (status is already idle)');
        return;
      }
      const endedUserId = payload?.fromUserId || get().otherUserId || 'remote user';
      console.log('[CALL_TRACE][Store] 🔴 Call ended by:', endedUserId);
      get().reset()
    }

    // Save references for cleanup
    state.handleCallAcceptedRef = handleCallAccepted
    state.handleCallRejectedRef = handleCallRejected
    state.handleCallEndedRef = handleCallEnded
    state.handleCallMissedRef = get().handleCallMissed
    state.handleStopRingingRef = get().handleStopRinging

    // Register event listeners
    socketService.onCallAccepted(handleCallAccepted)
    socketService.onCallRejected(handleCallRejected)
    socketService.onCallEnded(handleCallEnded)
    socketService.onCallCancelled(handleCallEnded)
    socketService.onCallMissed(get().handleCallMissed)
    socketService.onCallStopRinging(get().handleStopRinging)

    console.log('[CALL_TRACE][Store] ✅ Call event listeners initialized');
  },

  reset: () => {
    console.log('[CALL_TRACE][Store] 🔄 Resetting call state');
    callNotificationService.reportEndCall()
    InCallManager.stopRingback()
    InCallManager.stopRingtone()
    ringService.cleanup()
    InCallManager.stop()
    
    agoraService.leaveChannel()

    set({
      status: 'idle',
      callType: null,
      conversationId: null,
      otherUserId: null,
      otherUserName: null,
      remoteUid: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: false,
      isFrontCamera: true,
      error: null,
    })
  },

  cleanup: () => {
    console.log('[CALL_TRACE][Store] 🧹 Cleaning up call event listeners');
    isInitialized = false

    agoraService.cleanup()

    // Remove socket listeners
    const state = get() as any
    if (state.handleCallAcceptedRef)
      socketService.offCallAccepted(state.handleCallAcceptedRef)
    if (state.handleCallRejectedRef)
      socketService.offCallRejected(state.handleCallRejectedRef)
    if (state.handleCallEndedRef) {
      socketService.offCallEnded(state.handleCallEndedRef)
      socketService.offCallCancelled(state.handleCallEndedRef)
    }
    if (state.handleCallMissedRef)
      socketService.offCallMissed(state.handleCallMissedRef)
    if (state.handleStopRingingRef)
      socketService.offCallStopRinging(state.handleStopRingingRef)

    set({
      status: 'idle',
      callType: null,
      conversationId: null,
      otherUserId: null,
      otherUserName: null,
      remoteUid: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: false,
      isFrontCamera: true,
      error: null,
    })
    console.log('[CALL_TRACE][Store] ✅ Call cleanup complete');
  },
}))
