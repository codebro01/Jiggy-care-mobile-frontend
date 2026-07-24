import { createAgoraRtcEngine, IRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { api } from './api.service';
import InCallManager from 'react-native-incall-manager';
import { PermissionsAndroid, Platform } from 'react-native';

const APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

class AgoraService {
    engine?: IRtcEngine;
    isInitialized = false;
    currentChannel?: string;

    async checkPermissions(video: boolean, audio: boolean) {
        if (Platform.OS === 'android') {
            try {
                const permissions = [];
                if (audio) permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (video) permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);

                const granted = await PermissionsAndroid.requestMultiple(permissions);

                for (const permission of permissions) {
                    if (granted[permission] !== PermissionsAndroid.RESULTS.GRANTED) {
                        throw new Error(`Permission ${permission} not granted`);
                    }
                }
                console.log('[CALL_TRACE][Agora] ✅ All permissions (Camera/Mic) granted');
            } catch (err: any) {
                console.error('[CALL_TRACE][Agora] ❌ Permission error:', err);
                throw err;
            }
        }
    }

    async initEngine(
        onUserJoined: (uid: number) => void,
        onUserOffline: (uid: number) => void
    ) {
        if (this.isInitialized) return;

        try {
            console.log(`[CALL_TRACE][Agora] 🎬 Initializing Agora Engine with App ID: "${APP_ID}"`);
            this.engine = createAgoraRtcEngine();
            this.engine.initialize({ appId: APP_ID });

            this.engine.registerEventHandler({
                onJoinChannelSuccess: (connection, elapsed) => {
                    console.log('[CALL_TRACE][Agora] ✅ Joined channel successfully. Channel ID:', connection.channelId, 'Elapsed:', elapsed);
                },
                onUserJoined: (connection, remoteUid, elapsed) => {
                    console.log(`[CALL_TRACE][Agora] ✅ Remote user joined. UID: ${remoteUid}, Elapsed: ${elapsed}`);
                    onUserJoined(remoteUid);
                },
                onUserOffline: (connection, remoteUid, reason) => {
                    console.log(`[CALL_TRACE][Agora] 🔴 Remote user offline. UID: ${remoteUid}, Reason: ${reason}`);
                    onUserOffline(remoteUid);
                },
                onError: (err, msg) => {
                    console.error('[CALL_TRACE][Agora] ❌ Agora Error. Code:', err, 'Message:', msg);
                }
            });

            this.isInitialized = true;
        } catch (e) {
            console.error('[CALL_TRACE][Agora] ❌ Error initializing Agora engine:', e);
            throw e;
        }
    }

    async joinChannel(channelName: string, isVideo: boolean) {
        if (!this.engine) throw new Error('Engine not initialized');

        await this.checkPermissions(isVideo, true);

        try {
            console.log(`[CALL_TRACE][Agora] 🔑 Fetching token for channel: ${channelName}`);
            // Fetch token from backend
            const response = await api.get<any>(`/agora/token?channelName=${channelName}`);
            console.log(`[CALL_TRACE][Agora] 📦 Full backend response:`, JSON.stringify(response, null, 2));
            const token = typeof response === 'string' ? response : response?.token;
            // Use the uid from the backend response if it exists, otherwise fallback to 0
            const uid = typeof response === 'string' ? 0 : (response?.uid || 0);

            if (!token) {
                console.error(`[CALL_TRACE][Agora] ❌ Failed to fetch token for channel ${channelName}`);
                throw new Error('Failed to fetch Agora token');
            }

            // Always enable audio for both audio and video calls
            this.engine.enableAudio();
            if (isVideo) {
                this.engine.enableVideo();
                this.engine.startPreview();
            }

            console.log(`[CALL_TRACE][Agora] 📡 Calling joinChannel. Channel: ${channelName}, UID: ${uid}, isVideo: ${isVideo}`);
            this.engine.joinChannel(token, channelName, uid, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: isVideo,
                autoSubscribeAudio: true,
                autoSubscribeVideo: isVideo,
            });

            this.currentChannel = channelName;
            InCallManager.start({ media: isVideo ? 'video' : 'audio' });
        } catch (e) {
            console.error('[CALL_TRACE][Agora] ❌ Exception in joinChannel:', e);
            throw e;
        }
    }

    leaveChannel() {
        if (this.engine) {
            console.log(`[CALL_TRACE][Agora] 🔌 Leaving channel ${this.currentChannel || 'unknown'}...`);
            this.engine.leaveChannel();
            this.engine.stopPreview();
            this.engine.disableVideo();
            this.engine.disableAudio();
            this.currentChannel = undefined;
        }
        InCallManager.stop();
    }

    toggleAudio(enabled: boolean) {
        if (this.engine) {
            console.log(`[CALL_TRACE][Agora] 🎤 Toggling Local Audio: ${enabled ? 'Unmuted' : 'Muted'}`);
            this.engine.enableLocalAudio(enabled);
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.engine) {
            console.log(`[CALL_TRACE][Agora] 📹 Toggling Local Video: ${enabled ? 'Enabled' : 'Disabled'}`);
            this.engine.enableLocalVideo(enabled);
        }
    }

    switchCamera() {
        if (this.engine) {
            console.log('[CALL_TRACE][Agora] 🔄 Switching Camera');
            this.engine.switchCamera();
        }
    }

    toggleSpeaker(enabled: boolean) {
        if (this.engine) {
            console.log(`[CALL_TRACE][Agora] 🔊 Toggling Speakerphone: ${enabled ? 'ON' : 'OFF'}`);
            this.engine.setEnableSpeakerphone(enabled);
            try {
                const { setAudioSessionPortOverride } = require('expo-callkit-telecom');
                setAudioSessionPortOverride(enabled);
            } catch (e) {
                console.warn('Failed to set CallKit speaker override', e);
            }
            InCallManager.setForceSpeakerphoneOn(enabled);
        }
    }

    cleanup() {
        console.log('[CALL_TRACE][Agora] 🧹 Cleaning up Agora Engine...');
        this.leaveChannel();
        if (this.engine) {
            this.engine.unregisterEventHandler({});
            this.engine.release();
            this.engine = undefined;
            this.isInitialized = false;
        }
        InCallManager.setForceSpeakerphoneOn(false);
    }
}

export const agoraService = new AgoraService();
