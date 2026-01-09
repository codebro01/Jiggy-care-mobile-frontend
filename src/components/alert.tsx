import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'warning';

interface AlertProps {
    type: AlertType;
    message: string;
    title?: string;
    visible: boolean;
    onClose?: () => void;
    autoHide?: boolean;
    duration?: number;
    style?: ViewStyle;
}

export function Alert({
    type,
    message,
    title,
    visible,
    onClose,
    autoHide = true,
    duration = 6000,
    style,
}: AlertProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            if (autoHide && onClose) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);
                return () => clearTimeout(timer);
            }
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose?.();
        });
    };

    if (!visible) return null;

    const config = getAlertConfig(type);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    borderLeftColor: config.borderColor,
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
                style,
            ]}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={config.icon} size={24} color={config.iconColor} />
            </View>

            <View style={styles.content}>
                {title && <Text style={[styles.title, { color: config.textColor }]}>{title}</Text>}
                <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
            </View>

            {onClose && (
                <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
                    <Ionicons name="close" size={20} color={config.textColor} />
                </Pressable>
            )}
        </Animated.View>
    );
}

function getAlertConfig(type: AlertType) {
    switch (type) {
        case 'success':
            return {
                backgroundColor: '#D1FAE5',
                borderColor: '#10B981',
                iconColor: '#059669',
                textColor: '#065F46',
                icon: 'checkmark-circle' as const,
            };
        case 'error':
            return {
                backgroundColor: '#FEE2E2',
                borderColor: '#EF4444',
                iconColor: '#DC2626',
                textColor: '#991B1B',
                icon: 'close-circle' as const,
            };
        case 'warning':
            return {
                backgroundColor: '#FEF3C7',
                borderColor: '#F59E0B',
                iconColor: '#D97706',
                textColor: '#92400E',
                icon: 'alert-circle' as const,
            };
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 9999,
    },
    iconContainer: {
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});

// Hook for easier usage
export function useAlert() {
    const [alert, setAlert] = React.useState<{
        visible: boolean;
        type: AlertType;
        message: string;
        title?: string;
    }>({
        visible: false,
        type: 'success',
        message: '',
    });

    const showAlert = (type: AlertType, message: string, title?: string) => {
        setAlert({ visible: true, type, message, title });
    };

    const hideAlert = () => {
        setAlert((prev) => ({ ...prev, visible: false }));
    };

    return {
        alert,
        showAlert,
        hideAlert,
        showSuccess: (message: string, title?: string) => showAlert('success', message, title),
        showError: (message: string, title?: string) => showAlert('error', message, title),
        showWarning: (message: string, title?: string) => showAlert('warning', message, title),
    };
}