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
                console.log('✅ All permissions granted');
            } catch (err: any) {
                console.error('Permission error:', err);
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
            console.log('🎬 Initializing Agora Engine...');
            this.engine = createAgoraRtcEngine();
            this.engine.initialize({ appId: APP_ID });

            this.engine.registerEventHandler({
                onJoinChannelSuccess: (connection, elapsed) => {
                    console.log('✅ Joined channel successfully', connection.channelId);
                },
                onUserJoined: (connection, remoteUid, elapsed) => {
                    console.log('✅ Remote user joined:', remoteUid);
                    onUserJoined(remoteUid);
                },
                onUserOffline: (connection, remoteUid, reason) => {
                    console.log('🔴 Remote user offline:', remoteUid);
                    onUserOffline(remoteUid);
                },
                onError: (err, msg) => {
                    console.error('Agora Error:', err, msg);
                }
            });

            this.isInitialized = true;
        } catch (e) {
            console.error('Error initializing Agora engine:', e);
            throw e;
        }
    }

    async joinChannel(channelName: string, isVideo: boolean) {
        if (!this.engine) throw new Error('Engine not initialized');

        await this.checkPermissions(isVideo, true);

        try {
            console.log(`🔑 Fetching token for channel: ${channelName}`);
            // Fetch token from backend
            const response = await api.get<any>(`/agora/token?channelName=${channelName}`);
            const token = typeof response === 'string' ? response : response?.token;

            if (!token) {
                throw new Error('Failed to fetch Agora token');
            }

            if (isVideo) {
                this.engine.enableVideo();
                this.engine.startPreview();
            } else {
                this.engine.enableAudio();
            }

            console.log(`📡 Joining channel: ${channelName} with token`);
            this.engine.joinChannel(token, channelName, 0, {
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
            console.error('Failed to join channel:', e);
            throw e;
        }
    }

    leaveChannel() {
        if (this.engine) {
            console.log('🔌 Leaving channel...');
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
            this.engine.enableLocalAudio(enabled);
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.engine) {
            this.engine.enableLocalVideo(enabled);
        }
    }

    switchCamera() {
        if (this.engine) {
            this.engine.switchCamera();
        }
    }

    toggleSpeaker(enabled: boolean) {
        if (this.engine) {
            this.engine.setEnableSpeakerphone(enabled);
            InCallManager.setForceSpeakerphoneOn(enabled);
        }
    }

    cleanup() {
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
