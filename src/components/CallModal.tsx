import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '@/stores/callStore';
import { useAppTheme } from '@/theme';
import { Avatar } from './Avatar';

export const CallModal = () => {
    const theme = useAppTheme();
    const {
        status,
        callType,
        localStream,
        remoteStream,
        isMuted,
        isVideoEnabled,
        otherUserName,
        endCall,
        acceptCall,
        rejectCall,
        toggleMute,
        toggleVideo,
        switchCamera
    } = useCallStore();

    const isVisible = status !== 'idle';
    const isIncoming = status === 'incoming';
    const isConnected = status === 'connected';
    const displayName = otherUserName || 'Unknown';

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => {
                // Prevent closing by back button if calling
                // minimal handling: could minimize or prompt
            }}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                {/* Remote Stream (connected video call) */}
                {isConnected && remoteStream && callType === 'video' ? (
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={styles.remoteVideo}
                        objectFit="cover"
                        mirror={false}
                    />
                ) : (status === 'calling' || status === 'ringing') && localStream && callType === 'video' ? (
                    /* Show local camera as full-screen preview while calling/ringing */
                    <View style={styles.callingVideoContainer}>
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.remoteVideo}
                            objectFit="cover"
                            mirror={true}
                        />
                        <View style={styles.callingOverlay}>
                            <Avatar name={displayName} size="xl" />
                            <Text style={[styles.statusText, { color: '#FFFFFF', marginTop: 16 }]}>
                                {status === 'ringing' ? 'Ringing...' : 'Calling...'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.remoteVideoPlaceholder, { backgroundColor: '#1a1a2e' }]}>
                        <Avatar name={displayName} size="xl" />

                        {/* Error Message */}
                        {useCallStore.getState().error ? (
                            <Text style={[styles.statusText, { color: theme.colors.palette.error[500], marginTop: 16, textAlign: 'center' }]}>
                                {useCallStore.getState().error}
                            </Text>
                        ) : (
                            <Text style={[styles.statusText, { color: 'rgba(255,255,255,0.9)', marginTop: 16 }]}>
                                {status === 'ringing' ? 'Ringing...' : status === 'calling' ? 'Calling...' : status === 'incoming' ? 'Incoming Call...' : 'Connected'}
                            </Text>
                        )}
                        <Text style={[styles.callerName, { color: '#FFFFFF' }]}>
                            {displayName}
                        </Text>
                    </View>
                )}

                {/* Local Stream (PIP) - show when connected */}
                {isConnected && localStream && callType === 'video' && isVideoEnabled && (
                    <View style={styles.localVideoContainer}>
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.localVideo}
                            objectFit="cover"
                            mirror={true}
                        />
                    </View>
                )}

                {/* Incoming Call Controls */}
                {isIncoming && (
                    <View style={styles.incomingControls}>
                        <View style={styles.incomingInfo}>
                            <Text style={[styles.incomingText, { color: theme.colors.text.primary }]}>
                                Incoming {callType} Call
                            </Text>
                        </View>
                        <View style={styles.incomingButtons}>
                            <Pressable
                                style={[styles.controlButton, { backgroundColor: theme.colors.palette.error[500] }]}
                                onPress={rejectCall}
                            >
                                <Ionicons name="close" size={32} color="white" />
                                <Text style={styles.buttonLabel}>Decline</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.controlButton, { backgroundColor: theme.colors.palette.success[500] }]}
                                onPress={acceptCall}
                            >
                                <Ionicons name="call" size={32} color="white" />
                                <Text style={styles.buttonLabel}>Accept</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Active Call Controls */}
                {!isIncoming && (
                    <View style={styles.controlsContainer}>
                        <View style={styles.controlsRow}>
                            <Pressable
                                style={[styles.controlButton, { backgroundColor: isMuted ? 'white' : 'rgba(255,255,255,0.2)' }]}
                                onPress={toggleMute}
                            >
                                <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? 'black' : 'white'} />
                            </Pressable>

                            <Pressable
                                style={[styles.controlButton, { backgroundColor: theme.colors.palette.error[500], width: 64, height: 64 }]}
                                onPress={endCall}
                            >
                                <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                            </Pressable>

                            {callType === 'video' && (
                                <Pressable
                                    style={[styles.controlButton, { backgroundColor: !isVideoEnabled ? 'white' : 'rgba(255,255,255,0.2)' }]}
                                    onPress={toggleVideo}
                                >
                                    <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={24} color={!isVideoEnabled ? 'black' : 'white'} />
                                </Pressable>
                            )}
                        </View>
                        {callType === 'video' && (
                            <View style={[styles.controlsRow, { marginTop: 20 }]}>
                                <Pressable
                                    style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                    onPress={switchCamera}
                                >
                                    <Ionicons name="camera-reverse" size={24} color="white" />
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
    },
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callingVideoContainer: {
        flex: 1,
    },
    callingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 20,
        fontWeight: '600',
    },
    callerName: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
    },
    localVideoContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    incomingControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 60,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        top: 0,
        justifyContent: 'flex-end',
    },
    incomingInfo: {
        marginBottom: 60,
        alignItems: 'center',
    },
    incomingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    incomingButtons: {
        flexDirection: 'row',
        gap: 60,
    },
    buttonLabel: {
        color: 'white',
        marginTop: 8,
        fontSize: 12,
    },
});
