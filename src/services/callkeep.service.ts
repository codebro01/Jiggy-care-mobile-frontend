import RNCallKeep, { IOptions } from 'react-native-callkeep';
import { Platform, AppState } from 'react-native';

class CallKeepService {
    private isInitialized = false;
    private pendingCallData: any = null;

    async setup() {
        if (this.isInitialized) return;

        const options: IOptions = {
            ios: {
                appName: 'Jiggy Care',
            },
            android: {
                alertTitle: 'Permissions required',
                alertDescription: 'This application needs to access your phone accounts',
                cancelButton: 'Cancel',
                okButton: 'ok',
                imageName: 'phone_account_icon',
                additionalPermissions: [],
                // Required for native incoming call UI to show when app is backgrounded
                selfManaged: true,
            }
        };

        try {
            await RNCallKeep.setup(options);
            RNCallKeep.setAvailable(true);
            this.isInitialized = true;
            console.log('✅ CallKeep initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize CallKeep:', error);
        }
    }

    private activeCallUUID: string | null = null;

    displayIncomingCall(callerName: string, callType: 'video' | 'audio', callData: any) {
        if (!this.isInitialized) return null;

        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        this.pendingCallData = { ...callData, uuid, callType };
        this.activeCallUUID = uuid;

        console.log(`📱 Displaying native incoming call UI for ${callerName} (UUID: ${uuid})`);
        
        const hasVideo = callType === 'video';
        RNCallKeep.displayIncomingCall(uuid, 'Jiggy Care', callerName, 'generic', hasVideo);
        
        return uuid;
    }

    reportConnectedCall() {
        if (!this.isInitialized || !this.activeCallUUID) return;
        RNCallKeep.setCurrentCallActive(this.activeCallUUID);
        console.log(`📞 Reported call ${this.activeCallUUID} as active to native UI`);
    }

    reportEndCall() {
        if (!this.isInitialized) return;
        if (this.activeCallUUID) {
            RNCallKeep.endCall(this.activeCallUUID);
            this.activeCallUUID = null;
        }
        RNCallKeep.endAllCalls();
        console.log(`🔴 Reported calls ended to native UI`);
    }

    getPendingCallData() {
        return this.pendingCallData;
    }

    clearPendingCallData() {
        this.pendingCallData = null;
    }

    registerListeners(callbacks: {
        onAnswerCall: (uuid: string) => void;
        onEndCall: (uuid: string) => void;
    }) {
        if (!this.isInitialized) return;

        RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
            console.log(`✅ User answered call ${callUUID} from native UI`);
            
            // Bring app to foreground if answered from background
            if (Platform.OS === 'android' && AppState.currentState !== 'active') {
                RNCallKeep.backToForeground();
            }
            
            callbacks.onAnswerCall(callUUID);
        });

        RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
            console.log(`🔴 User declined/ended call ${callUUID} from native UI`);
            callbacks.onEndCall(callUUID);
        });
    }

    removeListeners() {
        RNCallKeep.removeEventListener('answerCall');
        RNCallKeep.removeEventListener('endCall');
    }
}

export const callKeepService = new CallKeepService();
