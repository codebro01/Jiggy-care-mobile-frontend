import { create } from 'zustand';
import { MediaStream } from 'react-native-webrtc';
import { socketService } from '@/services/socket.service';
import { webRTCService } from '@/services/webrtc.service';
import { ringService } from '@/services/ring.service';
import { CallIncomingPayload, CallType } from '@/types';
import InCallManager from 'react-native-incall-manager';
import { useAppointmentsStore } from './appointmentsStore';

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
    isSpeakerOn: boolean;
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
    toggleSpeaker: () => void;
    switchCamera: () => void;
    reset: () => void;
    clearError: () => void;
    initialize: () => void;
    cleanup: () => void;
    handleCallMissed: (payload: { fromUserId: string; conversationId: string }) => void;
}


export const processOffer = async (
    payload: { fromUserId: string; offer: RTCSessionDescriptionInit },
    get: () => CallState,
    set: (partial: Partial<CallState>) => void
) => {
    const state = get() as any;
    state.isProcessingOffer = true;
    console.log('🔒 Locked offer processing');

    try {
        const { callType } = get();

        if (!webRTCService.localStream) {
            console.log('🎥 Starting local stream for answer...');
            const stream = await webRTCService.startLocalStream(callType === 'video', true);
            set({ localStream: stream });
        }

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
        }

        console.log('🔍 Setting remote description...');
        await webRTCService.setRemoteDescription(payload.offer);

        console.log('📜 Creating Answer...');
        const answer = await webRTCService.createAnswer();

        console.log('📤 Sending Answer to:', payload.fromUserId);
        socketService.sendWebRTCAnswer({ toUserId: payload.fromUserId, answer });

        console.log('✅ Answer sent successfully');
    } catch (error: any) {
        console.error('❌ Failed to process offer:', error);
        set({ error: error.message || 'Failed to process call' });
    } finally {
        setTimeout(() => {
            (get() as any).isProcessingOffer = false;
            console.log('🔓 Unlocked offer processing');
        }, 1000);
    }
};



let isInitialized = false;

export const useCallStore = create<CallState>()((set, get) => ({
    status: 'idle',
    callType: null,
    conversationId: null,
    otherUserId: null,
    otherUserName: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoEnabled: true,
    isSpeakerOn: false,
    isFrontCamera: true,
    error: null,
    pendingOffer: null,
    initiateCall: async (toUserId, conversationId, type, otherUserName) => {
        // Reset processing flag when initiating new call
        (useCallStore.getState() as any).isProcessingOffer = false;
        try {
            console.log('🚀 Initiating call:', { toUserId, conversationId, type });
            set({ status: 'calling', callType: type, conversationId, otherUserId: toUserId, otherUserName: otherUserName || null, error: null });

            // Start InCallManager audio session
            InCallManager.start({ media: type === 'video' ? 'video' : 'audio' });

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
        const { otherUserId, callType, pendingOffer } = get();
        if (!otherUserId) return;

        try {
            console.log('📞 Accepting call from:', otherUserId);
            ringService.stopRingtone();
            InCallManager.start({ media: callType === 'video' ? 'video' : 'audio' });
            set({ status: 'connected', error: null });

            // Start local stream
            console.log('🎥 Starting local stream...');
            const stream = await webRTCService.startLocalStream(callType === 'video', true);
            set({ localStream: stream });

            // Don't create peer connection here - handleWebRTCOffer will do it
            // when the offer arrives, to avoid duplicate peer connections

            // Notify the other peer that we accepted
            socketService.acceptCall({ toUserId: otherUserId });

                if (pendingOffer) {
            console.log('📦 Processing buffered offer after accept...');
            set({ pendingOffer: null });
            await processOffer(pendingOffer, get , set);
        } else {
            console.warn('⚠️ No buffered offer — waiting for offer to arrive...');
        }
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
        ringService.startRingtone();

        // Try to find the name from the appointments store
        const appointments = useAppointmentsStore.getState().appointments;
        const appointment = appointments.find(a =>
            a.bookingId === payload.conversationId ||
            a.patientId === payload.fromUserId
        );

        const name = appointment ? appointment.patientName : 'Unknown';

        set({
            status: 'incoming',
            callType: payload.callType,
            conversationId: payload.conversationId,
            otherUserId: payload.fromUserId,
            otherUserName: name,
            error: null,
        });
    },

    handleRinging: () => {
        console.log('🔔 Call is ringing on the other side');
        if (get().status === 'calling') {
            ringService.startRingback();
            set({ status: 'ringing' });
        }
    },

    handleStopRinging: () => {
        console.log('🔕 Stop ringing');
        ringService.stopRingtone();
        ringService.stopRingback();
        InCallManager.stopRingtone();
        InCallManager.stopRingback();
    },

    handleCallMissed: (payload) => {
        console.log('📵 Call missed from:', payload.fromUserId);
        get().reset();
    },

    handleNoAnswer: () => {
        console.log('📵 No answer');
        set({ error: 'No answer' });
        setTimeout(() => get().reset(), 3000);
    },

    toggleMute: () => {
        const newMuted = !get().isMuted;
        webRTCService.toggleAudio(!newMuted);
        InCallManager.setMicrophoneMute(newMuted);
        set({ isMuted: newMuted });
    },

    toggleVideo: () => {
        const newVideoEnabled = !get().isVideoEnabled;
        webRTCService.toggleVideo(newVideoEnabled);
        set({ isVideoEnabled: newVideoEnabled });
    },

    toggleSpeaker: () => {
        const newSpeakerOn = !get().isSpeakerOn;
        webRTCService.toggleSpeaker(newSpeakerOn);
        set({ isSpeakerOn: newSpeakerOn });
    },

    switchCamera: () => {
        webRTCService.switchCamera();
        set((state) => ({ isFrontCamera: !state.isFrontCamera }));
    },

    // reset: () => {
    //     console.log('🔄 Resetting call state');
    //     webRTCService.cleanup();
    //     set({
    //         status: 'idle',
    //         callType: null,
    //         conversationId: null,
    //         otherUserId: null,
    //         otherUserName: null,
    //         localStream: null,
    //         remoteStream: null,
    //         isMuted: false,
    //         isVideoEnabled: true,
    //         error: null,
    //     });
    // },

    clearError: () => set({ error: null }),

    initialize: () => {
        console.log('🎬 Initializing call event listeners');

        if (isInitialized) {
            console.log('⚠️ Already initialized, skipping duplicate registration');
            return;
        }


        isInitialized = true;
        console.log('🎬 Initializing call event listeners');

        const state = get() as any;

        // WebRTC Signaling Event Handlers
        const handleWebRTCOffer = async (payload: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
            const { status, callType } = get();
            const state = get() as any;

            // ✅ If not accepted yet — buffer it, NEVER drop it
            if (status === 'idle' || status === 'incoming') {
                console.log('📦 Buffering offer — status is:', status);
                set({ pendingOffer: payload });
                return;
            }

            if (status !== 'connected') {
                console.log('⚠️ Ignoring offer - unexpected status:', status);
                return;
            }

            if (state.isProcessingOffer) {
                console.log('⚠️ Already processing an offer, ignoring duplicate');
                return;
            }

            // Set flag IMMEDIATELY to prevent race conditions
            state.isProcessingOffer = true;
            console.log('🔒 Locked offer processing');

            try {
                console.log('📥 Received WebRTC offer from:', payload.fromUserId);

                // Check if we already have a peer connection in the wrong state

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
            console.log('🚨🚨🚨 ANSWER HANDLER CALLED! 🚨🚨🚨');  // ← ADD THIS FIRST LINE
            console.log('📥 📥 📥 ANSWER RECEIVED FROM:', payload.fromUserId);
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
            InCallManager.stopRingback();
            ringService.stopRingback();
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

        // Save references for cleanup
        state.handleWebRTCOfferRef = handleWebRTCOffer;
        state.handleWebRTCAnswerRef = handleWebRTCAnswer;
        state.handleWebRTCIceCandidateRef = handleWebRTCIceCandidate;
        state.handleCallAcceptedRef = handleCallAccepted;
        state.handleCallRejectedRef = handleCallRejected;
        state.handleCallEndedRef = handleCallEnded;
        state.handleCallMissedRef = get().handleCallMissed;
        state.handleStopRingingRef = get().handleStopRinging;

        // Register event listeners
        socketService.onWebRTCOffer(handleWebRTCOffer);
        socketService.onWebRTCAnswer(handleWebRTCAnswer);
        socketService.onWebRTCIceCandidate(handleWebRTCIceCandidate);
        socketService.onCallAccepted(handleCallAccepted);
        socketService.onCallRejected(handleCallRejected);
        socketService.onCallEnded(handleCallEnded);
        socketService.onCallMissed(get().handleCallMissed);
        socketService.onCallStopRinging(get().handleStopRinging);

        console.log('✅ Call event listeners initialized');
    },


    reset: () => {
        console.log('🔄 Resetting call state');
        InCallManager.stopRingback();
        InCallManager.stopRingtone();
        ringService.cleanup();
        InCallManager.stop();
        webRTCService.cleanup(); // Clean up WebRTC peer connection
        (useCallStore.getState() as any).isProcessingOffer = false;
        set({
            status: 'idle',
            callType: null,
            conversationId: null,
            otherUserId: null,
            otherUserName: null,
            localStream: null,
            remoteStream: null,
            isSpeakerOn: false,
            error: null,
            pendingOffer: null,
        });
        // ✅ DO NOT remove socket listeners here
    },

    cleanup: () => {
        console.log('🧹 Cleaning up call event listeners');
        isInitialized = false;  // ✅ Only reset here

        webRTCService.cleanup();
        // Remove socket listeners
        const state = get() as any;
        if (state.handleWebRTCOfferRef) socketService.offWebRTCOffer(state.handleWebRTCOfferRef);
        if (state.handleWebRTCAnswerRef) socketService.offWebRTCAnswer(state.handleWebRTCAnswerRef);
        if (state.handleWebRTCIceCandidateRef) socketService.offWebRTCIceCandidate(state.handleWebRTCIceCandidateRef);
        if (state.handleCallAcceptedRef) socketService.offCallAccepted(state.handleCallAcceptedRef);
        if (state.handleCallRejectedRef) socketService.offCallRejected(state.handleCallRejectedRef);
        if (state.handleCallEndedRef) socketService.offCallEnded(state.handleCallEndedRef);
        if (state.handleCallMissedRef) socketService.offCallMissed(state.handleCallMissedRef);
        if (state.handleStopRingingRef) socketService.offCallStopRinging(state.handleStopRingingRef);

        set({
            status: 'idle',
            callType: null,
            conversationId: null,
            otherUserId: null,
            otherUserName: null,
            localStream: null,
            remoteStream: null,
            isSpeakerOn: false,
            error: null,
            pendingOffer: null,
        });
        console.log('✅ Call cleanup complete');
    },
}));
