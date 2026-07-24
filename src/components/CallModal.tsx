import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '@/stores/callStore';
import { useAppTheme } from '@/theme';
import { Avatar } from './Avatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CallModal = () => {
    const theme = useAppTheme();
    const {
        status,
        callType,
        remoteUid,
        isMuted,
        isVideoEnabled,
        isSpeakerOn,
        isFrontCamera,
        otherUserName,
        endCall,
        acceptCall,
        rejectCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        switchCamera
    } = useCallStore();

    const isVisible = status !== 'idle';
    const isIncoming = status === 'incoming';
    const isConnected = status === 'connected';
    const displayName = otherUserName || 'Patient';

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={false}
            statusBarTranslucent
            onRequestClose={() => {}}
        >
            <View style={styles.container}>
                {/* ── Background & Video Views ─────────────────────── */}
                {isConnected && remoteUid && callType === 'video' ? (
                    <RtcSurfaceView
                        canvas={{ uid: remoteUid }}
                        style={styles.remoteVideo}
                        zOrderMediaOverlay={false}
                    />
                ) : (status === 'calling' || status === 'ringing') && callType === 'video' ? (
                    <View style={styles.callingVideoContainer}>
                        <RtcSurfaceView
                            canvas={{ uid: 0 }}
                            style={styles.remoteVideo}
                            zOrderMediaOverlay={false}
                        />
                        <View style={styles.darkOverlay} />
                    </View>
                ) : (
                    <View style={styles.audioCallBackground} />
                )}

                {/* ── Caller Info Header (Show when not in full video stream) ── */}
                {(!isConnected || callType === 'audio' || !remoteUid) && (
                    <View style={styles.centerContent}>
                        {/* Outer Glow Ring */}
                        <View style={styles.avatarGlowRing}>
                            <Avatar name={displayName} size="xl" />
                        </View>

                        <Text style={styles.callTypeSubtitle}>
                            OUTGOING {callType?.toUpperCase() || 'AUDIO'} CALL
                        </Text>
                        
                        <Text style={styles.callerName} numberOfLines={1}>
                            {displayName}
                        </Text>

                        <Text style={styles.statusBadge}>
                            {useCallStore.getState().error ? (
                                <Text style={styles.errorText}>{useCallStore.getState().error}</Text>
                            ) : status === 'ringing' ? (
                                'Ringing...'
                            ) : status === 'calling' ? (
                                'Calling...'
                            ) : status === 'incoming' ? (
                                'Swipe or tap to answer...'
                            ) : (
                                'Call Connected'
                            )}
                        </Text>
                    </View>
                )}

                {/* ── Local Camera PIP (Video Call Connected) ─────── */}
                {isConnected && callType === 'video' && isVideoEnabled && (
                    <View style={styles.localVideoContainer}>
                        <RtcSurfaceView
                            canvas={{ uid: 0 }}
                            style={styles.localVideo}
                            zOrderMediaOverlay={true}
                        />
                    </View>
                )}

                {/* ── Incoming Call Controls (Accept / Decline) ────── */}
                {isIncoming && (
                    <View style={styles.incomingControlsOverlay}>
                        <View style={styles.actionButtonsRow}>
                            {/* Decline Action */}
                            <View style={styles.actionWrapper}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.circleButton,
                                        styles.declineButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={rejectCall}
                                >
                                    <Ionicons name="call" size={30} color="#FFFFFF" style={styles.declineIcon} />
                                </Pressable>
                                <Text style={styles.actionLabel}>Decline</Text>
                            </View>

                            {/* Accept Action */}
                            <View style={styles.actionWrapper}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.circleButton,
                                        styles.acceptButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={acceptCall}
                                >
                                    <Ionicons name="call" size={30} color="#FFFFFF" />
                                </Pressable>
                                <Text style={styles.actionLabel}>Accept</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Active Call Controls (Mute / Speaker / Video / End) ─ */}
                {!isIncoming && (
                    <View style={styles.activeControlsOverlay}>
                        <View style={styles.activeControlsCard}>
                            {/* Speaker Toggle */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.iconControlBtn,
                                    isSpeakerOn && styles.activeControlBtn,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={toggleSpeaker}
                            >
                                <Ionicons
                                    name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                                    size={24}
                                    color={isSpeakerOn ? '#0F172A' : '#FFFFFF'}
                                />
                            </Pressable>

                            {/* Mute Toggle */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.iconControlBtn,
                                    isMuted && styles.activeControlBtn,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={toggleMute}
                            >
                                <Ionicons
                                    name={isMuted ? 'mic-off' : 'mic'}
                                    size={24}
                                    color={isMuted ? '#0F172A' : '#FFFFFF'}
                                />
                            </Pressable>

                            {/* Video Toggle (Video calls only) */}
                            {callType === 'video' && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.iconControlBtn,
                                        !isVideoEnabled && styles.activeControlBtn,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={toggleVideo}
                                >
                                    <Ionicons
                                        name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                                        size={24}
                                        color={!isVideoEnabled ? '#0F172A' : '#FFFFFF'}
                                    />
                                </Pressable>
                            )}

                            {/* Camera Switch (Video calls only) */}
                            {callType === 'video' && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.iconControlBtn,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={switchCamera}
                                >
                                    <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
                                </Pressable>
                            )}

                            {/* End Call Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.circleButton,
                                    styles.endCallButton,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={endCall}
                            >
                                <Ionicons name="call" size={28} color="#FFFFFF" style={styles.declineIcon} />
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0E14',
    },
    audioCallBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0B0E14',
    },
    remoteVideo: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    callingVideoContainer: {
        flex: 1,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(11, 14, 20, 0.65)',
    },
    centerContent: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.22,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    avatarGlowRing: {
        padding: 12,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    callTypeSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#94A3B8',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    callerName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        fontSize: 15,
        fontWeight: '500',
        color: '#CBD5E1',
    },
    errorText: {
        color: '#EF4444',
        fontWeight: '600',
    },
    localVideoContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        width: 110,
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    incomingControlsOverlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '100%',
        paddingHorizontal: 40,
    },
    actionWrapper: {
        alignItems: 'center',
    },
    circleButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    declineButton: {
        backgroundColor: '#EF4444', // Sleek modern red
    },
    acceptButton: {
        backgroundColor: '#10B981', // Sleek modern green
    },
    endCallButton: {
        backgroundColor: '#EF4444',
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    declineIcon: {
        transform: [{ rotate: '135deg' }],
    },
    actionLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    activeControlsOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 20,
    },
    activeControlsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 40,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    iconControlBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeControlBtn: {
        backgroundColor: '#FFFFFF',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
});

