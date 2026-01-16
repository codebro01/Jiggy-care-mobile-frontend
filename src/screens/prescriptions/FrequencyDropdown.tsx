import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Input } from '../../components';

const FREQUENCY_OPTIONS = [
    { label: 'Once', value: 'once_daily' },
    { label: 'Twice', value: 'twice_daily' },
    { label: 'Thrice', value: 'thrice_daily' },
    { label: 'Four times', value: 'four_times_daily' },
    { label: 'Five times', value: 'five_times_daily' },
    { label: 'As needed', value: 'often' },
];

interface FrequencyDropdownProps {
    value: string;
    onSelect: (value: string) => void;
    label?: string;
    placeholder?: string;
    containerStyle?: any;
}

export function FrequencyDropdown({
    value,
    onSelect,
    label = 'Frequency',
    placeholder = 'Select frequency...',
    containerStyle,
}: FrequencyDropdownProps) {
    const theme = useAppTheme();
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = FREQUENCY_OPTIONS.find((opt) => opt.value === value);

    const handleSelect = (optionValue: string) => {
        onSelect(optionValue);
        setIsOpen(false);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Pressable onPress={() => setIsOpen(true)}>
                <View pointerEvents="none">
                    <Input
                        label={label}
                        placeholder={placeholder}
                        value={selectedOption?.label || value} // Fallback to value if label not found (e.g. if partial text was somehow set, though here it's strictly enum)
                        editable={false}
                        rightIcon="chevron-down"
                        containerStyle={{ marginBottom: 0 }} // Remove default margin from Input so wrapping container controls it
                    />
                </View>
            </Pressable>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsOpen(false)}
                >
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: theme.colors.background.primary },
                        ]}
                    >
                        <Text
                            style={[
                                styles.modalTitle,
                                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
                            ]}
                        >
                            Select Frequency
                        </Text>
                        <FlatList
                            data={FREQUENCY_OPTIONS}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.listItem,
                                        value === item.value && {
                                            backgroundColor: theme.colors.background.secondary,
                                        },
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text
                                        style={[
                                            styles.listItemText,
                                            {
                                                color: theme.colors.text.primary,
                                                fontFamily: theme.fontFamily.regular,
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {value === item.value && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={theme.colors.accent}
                                        />
                                    )}
                                </Pressable>
                            )}
                            showsVerticalScrollIndicator={false}
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        borderRadius: 16,
        maxHeight: '50%',
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    listItemText: {
        fontSize: 16,
    },
});
