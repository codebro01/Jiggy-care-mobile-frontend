
// Call Types
export type CallType = 'video' | 'audio';

export interface CallInitiatePayload {
    toUserId: string;
    conversationId: string;
    callType: CallType;
}

export interface CallIncomingPayload {
    fromUserId: string;
    conversationId: string;
    callType: CallType;
}

export interface CallAcceptedPayload {
    fromUserId: string;
}

export interface CallRejectedPayload {
    fromUserId: string;
    reason?: string;
}

export interface CallEndedPayload {
    fromUserId: string;
}

export interface WebRTCOfferPayload {
    fromUserId: string;
    offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerPayload {
    fromUserId: string;
    answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidatePayload {
    fromUserId: string;
    candidate: RTCIceCandidateInit;
}
