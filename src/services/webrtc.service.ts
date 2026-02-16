import {
    MediaStream,
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices,
} from 'react-native-webrtc';
import { PermissionsAndroid, Platform, Permission } from 'react-native';

class WebRTCService {
    peerConnection: RTCPeerConnection | null = null;
    localStream: MediaStream | null = null;
    remoteStream: MediaStream | null = null;

    private configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here if needed
        ],
    };

    async checkPermissions(video: boolean, audio: boolean) {
        if (Platform.OS === 'android') {
            try {
                const permissions: Permission[] = [];
                if (audio) permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (video) permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);

                const granted = await PermissionsAndroid.requestMultiple(permissions);

                for (const permission of permissions) {
                    if (granted[permission] !== PermissionsAndroid.RESULTS.GRANTED) {
                        throw new Error(`Permission ${permission} not granted`);
                    }
                }

                console.log('✅ All permissions granted');
            } catch (err: any) {
                console.error('Permission error:', err);
                throw err;
            }
        }
    }

    async startLocalStream(video: boolean = true, audio: boolean = true) {
        try {
            await this.checkPermissions(video, audio);

            const stream = await mediaDevices.getUserMedia({
                audio,
                video: video ? {
                    facingMode: 'user',
                    width: 640,
                    height: 480,
                    frameRate: 30,
                } : false,
            });
            this.localStream = stream;
            return stream;
        } catch (error) {
            console.error('Error starting local stream:', error);
            throw error;
        }
    }

    createPeerConnection(
        onIceCandidate: (candidate: RTCIceCandidate) => void,
        onTrack: (stream: MediaStream) => void
    ) {
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // react-native-webrtc uses EventTarget from event-target-shim;
        // cast to any to work around strict event type resolution
        const pc = this.peerConnection as any;

        pc.addEventListener('icecandidate', (event: any) => {
            if (event.candidate) {
                onIceCandidate(event.candidate);
            }
        });

        pc.addEventListener('track', (event: any) => {
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                onTrack(event.streams[0]);
            }
        });


        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        return this.peerConnection;
    }

    async createOffer() {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        const offer = await this.peerConnection.createOffer({});
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async createAnswer() {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async setRemoteDescription(description: RTCSessionDescription | RTCSessionDescriptionInit) {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        // Ensure sdp is a string, even if empty, to satisfy stricter types if needed, 
        // though RTCSessionDescriptionInit should allow optional sdp.
        // The error suggests mismatch between Init and class. 
        // We can just pass description if it matches Init, or recreate it.
        // The safest way with react-native-webrtc is often just passing the object if it's Init.

        const sessionDesc = description instanceof RTCSessionDescription
            ? description
            : new RTCSessionDescription(description as any); // Type assertion to bypass strict mismatch if needed

        await this.peerConnection.setRemoteDescription(sessionDesc);
    }

    async addIceCandidate(candidate: RTCIceCandidate | RTCIceCandidateInit) {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    toggleAudio(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    switchCamera() {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                // @ts-ignore - _switchCamera is specific to react-native-webrtc
                track._switchCamera();
            });
        }
    }

    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.remoteStream = null;
    }
}

export const webRTCService = new WebRTCService();
