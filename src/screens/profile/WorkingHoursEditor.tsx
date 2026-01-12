/**
 * Working Hours Editor Component
 * WhatsApp Business style editor
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface WorkingHoursData {
    [key: string]: string;
}

interface WorkingHoursEditorProps {
    visible: boolean;
    workingHours: WorkingHoursData;
    onClose: () => void;
    onSave: (hours: WorkingHoursData) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const period = i < 12 ? 'am' : 'pm';
    return `${hour}${period}`;
});

export function WorkingHoursEditor({ visible, workingHours, onClose, onSave }: WorkingHoursEditorProps) {
    const [hours, setHours] = useState<WorkingHoursData>(workingHours || {});
    const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [tempFrom, setTempFrom] = useState('9AM');
    const [tempTo, setTempTo] = useState('5PM');

    const handleDayPress = (day: DayOfWeek) => {
        setSelectedDay(day);
        const existing = hours[day];
        if (existing) {
            const [from, to] = existing.split('-');
            setTempFrom(from);
            setTempTo(to);
        } else {
            setTempFrom('9AM');
            setTempTo('5PM');
        }
        setShowFromPicker(true);
    };

    const handleRemoveDay = (day: DayOfWeek) => {
        const newHours = { ...hours };
        delete newHours[day];
        setHours(newHours);
    };

    const handleFromSelect = (time: string) => {
        setTempFrom(time);
        setShowFromPicker(false);
        setShowToPicker(true);
    };

    const handleToSelect = (time: string) => {
        setTempTo(time);
        setShowToPicker(false);

        if (selectedDay) {
            setHours({
                ...hours,
                [selectedDay]: `${tempFrom}-${time}`,
            });
        }
        setSelectedDay(null);
    };

    const handleSave = () => {
        onSave(hours);
        onClose();
    };

    const formatTime = (timeStr: string) => {
        return timeStr.toLowerCase().replace(/(\d+)(am|pm)/, '$1$2');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose}>
                        <Ionicons name="close" size={24} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Working Hours</Text>
                    <Pressable onPress={handleSave}>
                        <Text style={styles.saveButton}>Save</Text>
                    </Pressable>
                </View>

                <ScrollView style={styles.content}>
                    <Text style={styles.subtitle}>Select the days and hours you're available</Text>

                    {/* Days List */}
                    {DAYS.map((day) => {
                        const hasHours = hours[day.key];

                        return (
                            <View key={day.key} style={styles.dayRow}>
                                <Pressable
                                    style={styles.dayButton}
                                    onPress={() => handleDayPress(day.key)}
                                >
                                    <View style={styles.dayContent}>
                                        <Text style={styles.dayLabel}>{day.label}</Text>
                                        {hasHours ? (
                                            <Text style={styles.timeText}>{formatTime(hasHours)}</Text>
                                        ) : (
                                            <Text style={styles.addText}>Add hours</Text>
                                        )}
                                    </View>
                                    <Ionicons
                                        name={hasHours ? "create-outline" : "add-circle-outline"}
                                        size={24}
                                        color="#007AFF"
                                    />
                                </Pressable>

                                {hasHours && (
                                    <Pressable
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveDay(day.key)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Time Picker Modal - From */}
                <Modal visible={showFromPicker} animationType="slide" transparent>
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>From</Text>
                                <Pressable onPress={() => setShowFromPicker(false)}>
                                    <Ionicons name="close" size={24} color="#000" />
                                </Pressable>
                            </View>
                            <ScrollView style={styles.pickerScroll}>
                                {HOURS.map((time) => (
                                    <Pressable
                                        key={time}
                                        style={styles.timeOption}
                                        onPress={() => handleFromSelect(time)}
                                    >
                                        <Text style={[
                                            styles.timeOptionText,
                                            tempFrom === time && styles.selectedTime
                                        ]}>
                                            {time.toLowerCase()}
                                        </Text>
                                        {tempFrom === time && (
                                            <Ionicons name="checkmark" size={24} color="#007AFF" />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Time Picker Modal - To */}
                <Modal visible={showToPicker} animationType="slide" transparent>
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>To</Text>
                                <Pressable onPress={() => setShowToPicker(false)}>
                                    <Ionicons name="close" size={24} color="#000" />
                                </Pressable>
                            </View>
                            <ScrollView style={styles.pickerScroll}>
                                {HOURS.map((time) => (
                                    <Pressable
                                        key={time}
                                        style={styles.timeOption}
                                        onPress={() => handleToSelect(time)}
                                    >
                                        <Text style={[
                                            styles.timeOptionText,
                                            tempTo === time && styles.selectedTime
                                        ]}>
                                            {time.toLowerCase()}
                                        </Text>
                                        {tempTo === time && (
                                            <Ionicons name="checkmark" size={24} color="#007AFF" />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 30,
    },
    content: {
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        padding: 16,
        paddingBottom: 8,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    dayButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    dayContent: {
        flex: 1,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    addText: {
        fontSize: 14,
        color: '#007AFF',
    },
    removeButton: {
        padding: 16,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    pickerScroll: {
        maxHeight: 400,
    },
    timeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    timeOptionText: {
        fontSize: 16,
    },
    selectedTime: {
        color: '#007AFF',
        fontWeight: '600',
    },
});