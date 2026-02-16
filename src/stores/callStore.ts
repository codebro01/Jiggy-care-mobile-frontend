import { create } from 'zustand';
import { MediaStream } from 'react-native-webrtc';
import { socketService } from '@/services/socket.service';
import { webRTCService } from '@/services/webrtc.service';
import { CallIncomingPayload, CallType } from '@/types';

type CallStatus = 'idle' | 'calling' | 'ringing' | 'incoming' | 'connected' | 'ended';

interface CallState {
    status: CallStatus;
    callType: CallType | null;
    conversationId: string | null;
    otherUserId: string | null;
    otherUserName: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isFrontCamera: boolean;

    error: string | null;

    // Actions
    initiateCall: (toUserId: string, conversationId: string, type: CallType, otherUserName?: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    handleIncomingCall: (payload: CallIncomingPayload) => void;
    handleRinging: () => void;
    handleStopRinging: () => void;
    handleNoAnswer: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    switchCamera: () => void;
    reset: () => void;
    clearError: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
    status: 'idle',
    callType: null,
    conversationId: null,
    otherUserId: null,
    otherUserName: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoEnabled: true,
    isFrontCamera: true,
    error: null,

    initiateCall: async (toUserId, conversationId, type, otherUserName) => {
        try {
            console.log('🚀 Initiating call:', { toUserId, conversationId, type });
            set({ status: 'calling', callType: type, conversationId, otherUserId: toUserId, otherUserName: otherUserName || null, error: null });

            // Start local stream
            console.log('🎥 Starting local stream...');
            const stream = await webRTCService.startLocalStream(type === 'video', true);
            console.log('✅ Local stream started:', stream.id);
            set({ localStream: stream });

            // Initialize PeerConnection
            console.log('🛠 Creating PeerConnection...');
            webRTCService.createPeerConnection(
                (candidate) => {
                    console.log('🧊 ICE Candidate generated');
                    socketService.sendWebRTCIceCandidate({
                        toUserId,
                        candidate: candidate.toJSON(),
                    });
                },
                (stream) => {
                    console.log('📺 Remote stream received:', stream.id);
                    set({ remoteStream: stream });
                }
            );

            // Create Offer
            console.log('📜 Creating Offer...');
            const offer = await webRTCService.createOffer();
            console.log('📤 Sending Offer...');
            socketService.sendWebRTCOffer({ toUserId, offer });

            // Notify backend
            console.log('📞 Notifying backend of call initiation...');
            socketService.initiateCall({
                toUserId,
                conversationId,
                callType: type,
            });

        } catch (error: any) {
            console.error('❌ Failed to initiate call:', error);
            set({ error: error.message || 'Failed to initiate call' });
            // Don't reset immediately so user can see error
            // get().reset(); 
            setTimeout(() => get().reset(), 3000);
        }
    },

    acceptCall: async () => {
        const { otherUserId, callType } = get();
        if (!otherUserId) return;

        try {
            console.log('📞 Accepting call from:', otherUserId);
            set({ status: 'connected', error: null });

            // Start local stream
            console.log('🎥 Starting local stream...');
            const stream = await webRTCService.startLocalStream(callType === 'video', true);
            set({ localStream: stream });

            // Initialize PeerConnection
            webRTCService.createPeerConnection(
                (candidate) => {
                    socketService.sendWebRTCIceCandidate({
                        toUserId: otherUserId,
                        candidate: candidate.toJSON(),
                    });
                },
                (stream) => {
                    console.log('📺 Remote stream received');
                    set({ remoteStream: stream });
                }
            );

            socketService.acceptCall({ toUserId: otherUserId });
        } catch (error: any) {
            console.error('❌ Failed to accept call:', error);
            set({ error: error.message || 'Failed to accept call' });
            setTimeout(() => get().reset(), 3000);
        }
    },

    rejectCall: () => {
        const { otherUserId } = get();
        if (otherUserId) {
            socketService.rejectCall({ toUserId: otherUserId });
        }
        get().reset();
    },

    endCall: () => {
        const { otherUserId } = get();
        if (otherUserId) {
            socketService.endCall({ toUserId: otherUserId });
        }
        webRTCService.cleanup();
        get().reset();
    },

    handleIncomingCall: (payload) => {
        console.log('📞 Incoming call received:', payload);
        set({
            status: 'incoming',
            callType: payload.callType,
            conversationId: payload.conversationId,
            otherUserId: payload.fromUserId,
            error: null,
        });
    },

    handleRinging: () => {
        console.log('🔔 Call is ringing on the other side');
        if (get().status === 'calling') {
            set({ status: 'ringing' });
        }
    },

    handleStopRinging: () => {
        console.log('🔕 Stop ringing');
    },

    handleNoAnswer: () => {
        console.log('📵 No answer');
        set({ error: 'No answer' });
        setTimeout(() => get().reset(), 3000);
    },

    toggleMute: () => {
        const newMuted = !get().isMuted;
        webRTCService.toggleAudio(!newMuted);
        set({ isMuted: newMuted });
    },

    toggleVideo: () => {
        const newVideoEnabled = !get().isVideoEnabled;
        webRTCService.toggleVideo(newVideoEnabled);
        set({ isVideoEnabled: newVideoEnabled });
    },

    switchCamera: () => {
        webRTCService.switchCamera();
        set((state) => ({ isFrontCamera: !state.isFrontCamera }));
    },

    reset: () => {
        console.log('🔄 Resetting call state');
        webRTCService.cleanup();
        set({
            status: 'idle',
            callType: null,
            conversationId: null,
            otherUserId: null,
            otherUserName: null,
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isVideoEnabled: true,
            error: null,
        });
    },

    clearError: () => set({ error: null }),
}));
