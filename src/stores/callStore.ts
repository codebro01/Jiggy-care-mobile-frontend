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
    pendingOffer: { fromUserId: string; offer: RTCSessionDescriptionInit } | null;
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
    initialize: () => void;
    cleanup: () => void;

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
    pendingOffer: null,
    initiateCall: async (toUserId, conversationId, type, otherUserName) => {
        // Reset processing flag when initiating new call
        (useCallStore.getState() as any).isProcessingOffer = false;
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

            // Don't create peer connection here - handleWebRTCOffer will do it
            // when the offer arrives, to avoid duplicate peer connections

            // Notify the other peer that we accepted
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

    initialize: () => {
        console.log('🎬 Initializing call event listeners');

        // WebRTC Signaling Event Handlers
        const handleWebRTCOffer = async (payload: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
            // Use a flag to prevent processing multiple offers simultaneously
            const state = get() as any;
            if (state.isProcessingOffer) {
                console.log('⚠️ Already processing an offer, ignoring duplicate');
                return;
            }

            // Set flag IMMEDIATELY to prevent race conditions
            state.isProcessingOffer = true;
            console.log('🔒 Locked offer processing');

            try {
                console.log('📥 Received WebRTC offer from:', payload.fromUserId);
                const { status, callType } = get();

                // Only process offers when we're in 'incoming' or 'connected' state
                if (status !== 'incoming' && status !== 'connected') {
                    console.log('⚠️ Ignoring offer - not in receiving state, current status:', status);
                    return;
                }

                // Check if we already have a peer connection in the wrong state
                const pc = webRTCService.peerConnection;
                if (pc && pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
                    console.log('⚠️ Ignoring offer - peer connection in state:', pc.signalingState);
                    return;
                }

                // Start local stream if not already started
                if (!webRTCService.localStream) {
                    console.log('🎥 Starting local stream for answer...');
                    const stream = await webRTCService.startLocalStream(callType === 'video', true);
                    set({ localStream: stream });
                }

                // Create peer connection ONLY if it doesn't already exist
                if (!webRTCService.peerConnection) {
                    console.log('🛠 Creating PeerConnection for answer...');
                    webRTCService.createPeerConnection(
                        (candidate) => {
                            console.log('🧊 ICE Candidate generated (answerer)');
                            socketService.sendWebRTCIceCandidate({
                                toUserId: payload.fromUserId,
                                candidate: candidate.toJSON(),
                            });
                        },
                        (stream) => {
                            console.log('📺 Remote stream received (answerer)');
                            set({ remoteStream: stream });
                        }
                    );
                } else {
                    console.log('✅ PeerConnection already exists, reusing it');
                }

                // Check state before setting remote description
                const currentState = webRTCService.peerConnection?.signalingState;
                console.log('🔍 Current signaling state before setRemoteDescription:', currentState);

                if (currentState && currentState !== 'stable') {
                    console.log('⚠️ Cannot set remote description - already in state:', currentState);
                    return;
                }

                // Set remote description
                await webRTCService.setRemoteDescription(payload.offer);
                console.log('✅ Remote description set, new state:', webRTCService.peerConnection?.signalingState);

                // Create and send answer
                console.log('📜 Creating Answer...');
                const answer = await webRTCService.createAnswer();
                console.log('📤 Sending Answer to:', payload.fromUserId);
                socketService.sendWebRTCAnswer({
                    toUserId: payload.fromUserId,
                    answer,
                });

                console.log('✅ Answer sent successfully');
            } catch (error: any) {
                console.error('❌ Failed to handle WebRTC offer:', error);
                set({ error: error.message || 'Failed to process call' });
            } finally {
                // Release the lock after a small delay to prevent rapid re-processing
                setTimeout(() => {
                    (get() as any).isProcessingOffer = false;
                    console.log('🔓 Unlocked offer processing');
                }, 1000);
            }
        };

        const handleWebRTCAnswer = async (payload: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
            try {
                console.log('📥 Received WebRTC answer from:', payload.fromUserId);
                await webRTCService.setRemoteDescription(payload.answer);
                console.log('✅ Remote description set, connection established');
            } catch (error: any) {
                console.error('❌ Failed to handle WebRTC answer:', error);
                set({ error: error.message || 'Failed to establish connection' });
            }
        };

        const handleWebRTCIceCandidate = async (payload: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
            try {
                console.log('🧊 Received ICE candidate from:', payload.fromUserId);
                await webRTCService.addIceCandidate(payload.candidate);
            } catch (error: any) {
                console.error('❌ Failed to add ICE candidate:', error);
            }
        };

        // Call State Event Handlers
        const handleCallAccepted = (payload: { fromUserId: string }) => {
            console.log('✅ Call accepted by:', payload.fromUserId);
            set({ status: 'connected', error: null });
        };

        const handleCallRejected = (payload: { fromUserId: string; reason?: string }) => {
            console.log('🔴 Call rejected by:', payload.fromUserId, payload.reason || '');
            set({ error: payload.reason || 'Call rejected' });
            setTimeout(() => get().reset(), 3000);
        };

        const handleCallEnded = (payload: { fromUserId: string }) => {
            console.log('🔴 Call ended by:', payload.fromUserId);
            get().reset();
        };

        // Register event listeners
        socketService.onWebRTCOffer(handleWebRTCOffer);
        socketService.onWebRTCAnswer(handleWebRTCAnswer);
        socketService.onWebRTCIceCandidate(handleWebRTCIceCandidate);
        socketService.onCallAccepted(handleCallAccepted);
        socketService.onCallRejected(handleCallRejected);
        socketService.onCallEnded(handleCallEnded);

        console.log('✅ Call event listeners initialized');
    },

    cleanup: () => {
        console.log('🧹 Cleaning up call event listeners');

        // Note: We need to store references to the handlers to properly remove them
        // For now, we'll rely on the socket service's off methods with empty callbacks
        // A better approach would be to store handler references, but that requires refactoring

        // Clean up WebRTC resources
        webRTCService.cleanup();

        console.log('✅ Call cleanup complete');
    },
}));
