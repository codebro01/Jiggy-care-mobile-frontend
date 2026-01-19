/**
 * Jiggy Care Mobile - Dropdown Component
 * Select input with validation states and variants
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
    Modal,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme';

type DropdownVariant = 'default' | 'filled';

interface DropdownItem {
    label: string;
    value: string;
}

interface DropdownProps {
    label?: string;
    error?: string;
    hint?: string;
    variant?: DropdownVariant;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    placeholder?: string;
    data: DropdownItem[];
    value?: string;
    onSelect: (item: DropdownItem) => void;
    containerStyle?: ViewStyle;
}

export function Dropdown({
    label,
    error,
    hint,
    variant = 'default',
    leftIcon,
    placeholder = 'Select an option',
    data,
    value,
    onSelect,
    containerStyle,
}: DropdownProps) {
    const theme = useAppTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const borderWidth = useSharedValue(1);

    const selectedItem = data.find((item) => item.value === value);

    const animatedBorderStyle = useAnimatedStyle(() => ({
        borderWidth: borderWidth.value,
    }));

    const handleOpen = () => {
        setIsFocused(true);
        borderWidth.value = withTiming(2, { duration: 150 });
        setModalVisible(true);
    };

    const handleClose = () => {
        setIsFocused(false);
        borderWidth.value = withTiming(1, { duration: 150 });
        setModalVisible(false);
    };

    const handleSelect = (item: DropdownItem) => {
        onSelect(item);
        handleClose();
    };

    const getBorderColor = () => {
        if (error) return theme.colors.palette.error[500];
        if (isFocused) return theme.colors.accent;
        return theme.colors.border.primary;
    };

    const getBackgroundColor = () => {
        if (variant === 'filled') {
            return theme.isDark ? theme.colors.surface.secondary : theme.colors.background.secondary;
        }
        return theme.colors.surface.primary;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: error ? theme.colors.palette.error[500] : theme.colors.text.secondary,
                            fontFamily: theme.fontFamily.medium,
                            fontSize: theme.fontSize.caption,
                        },
                    ]}
                >
                    {label}
                </Text>
            )}

            <Pressable onPress={handleOpen}>
                <Animated.View
                    style={[
                        styles.inputContainer,
                        {
                            backgroundColor: getBackgroundColor(),
                            borderColor: getBorderColor(),
                            borderRadius: theme.borderRadius.md,
                        },
                        animatedBorderStyle,
                    ]}
                >
                    {leftIcon && (
                        <Ionicons
                            name={leftIcon}
                            size={20}
                            color={isFocused ? theme.colors.accent : theme.colors.text.tertiary}
                            style={styles.leftIcon}
                        />
                    )}

                    <Text
                        style={[
                            styles.input,
                            {
                                color: selectedItem ? theme.colors.text.primary : theme.colors.text.tertiary,
                                fontFamily: theme.fontFamily.regular,
                                fontSize: theme.fontSize.body,
                            },
                            leftIcon && styles.inputWithLeftIcon,
                        ]}
                    >
                        {selectedItem ? selectedItem.label : placeholder}
                    </Text>

                    <View style={styles.rightIcon}>
                        <Ionicons
                            name="chevron-down-outline"
                            size={20}
                            color={theme.colors.text.tertiary}
                        />
                    </View>
                </Animated.View>
            </Pressable>

            {(error || hint) && (
                <Text
                    style={[
                        styles.helperText,
                        {
                            color: error ? theme.colors.palette.error[500] : theme.colors.text.tertiary,
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.bodySmall,
                        },
                    ]}
                >
                    {error || hint}
                </Text>
            )}

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleClose}
            >
                <Pressable style={styles.modalOverlay} onPress={handleClose}>
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: theme.colors.surface.primary,
                                borderRadius: theme.borderRadius.lg,
                            },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold }]}>
                            {label || 'Select Option'}
                        </Text>
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        {
                                            borderBottomColor: theme.colors.border.secondary,
                                            backgroundColor: item.value === value ? theme.colors.surface.secondary : 'transparent'
                                        },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text
                                        style={[
                                            styles.itemText,
                                            {
                                                color: theme.colors.text.primary,
                                                fontFamily: theme.fontFamily.regular,
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.value === value && (
                                        <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    inputWithLeftIcon: {
        paddingLeft: 8,
    },
    leftIcon: {
        marginLeft: 12,
    },
    rightIcon: {
        padding: 12,
    },
    helperText: {
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        maxHeight: '50%',
        paddingVertical: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 16,
        marginBottom: 10,
        paddingHorizontal: 16,
        textAlign: 'center'
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    itemText: {
        fontSize: 16,
    },
});
