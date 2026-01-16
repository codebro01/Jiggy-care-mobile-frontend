import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';

interface Patient {
    fullName: string;
    patientId: string;
}

interface PatientDropdownProps {
    patients: Patient[];
    selectedPatientId: string;
    onSelectPatient: (patientId: string, patientName: string) => void;
    label?: string;
    placeholder?: string;
}

export function PatientDropdown({
    patients,
    selectedPatientId,
    onSelectPatient,
    label = 'Patient Name',
    placeholder = 'Select patient...',
}: PatientDropdownProps) {
    const theme = useAppTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedPatient = patients.find(p => p.patientId === selectedPatientId);

    const filteredPatients = patients.filter((patient) =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (patient: Patient) => {
        onSelectPatient(patient.patientId, patient.fullName);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text
                    style={[
                        styles.label,
                        { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.medium },
                    ]}
                >
                    {label}
                </Text>
            )}

            <Pressable
                style={[
                    styles.trigger,
                    {
                        backgroundColor: theme.colors.background.secondary,
                        borderColor: theme.colors.border.primary,
                    },
                ]}
                onPress={() => setIsOpen(true)}
            >
                <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={styles.leftIcon}
                />
                <Text
                    style={[
                        styles.triggerText,
                        {
                            color: selectedPatient
                                ? theme.colors.text.primary
                                : theme.colors.text.tertiary,
                            fontFamily: theme.fontFamily.regular,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {selectedPatient ? selectedPatient.fullName : placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.tertiary}
                />
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
                    <Pressable
                        style={[
                            styles.modalContent,
                            { backgroundColor: theme.colors.background.primary },
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View
                            style={[
                                styles.searchContainer,
                                {
                                    backgroundColor: theme.colors.background.secondary,
                                    borderColor: theme.colors.border.primary,
                                },
                            ]}
                        >
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color={theme.colors.text.tertiary}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        color: theme.colors.text.primary,
                                        fontFamily: theme.fontFamily.regular,
                                    },
                                ]}
                                placeholder="Search patients..."
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>

                        <FlatList
                            data={filteredPatients}
                            keyExtractor={(item) => item.patientId}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.listItem,
                                        selectedPatientId === item.patientId && {
                                            backgroundColor: theme.colors.background.secondary,
                                        },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Ionicons
                                        name="person-circle-outline"
                                        size={24}
                                        color={theme.colors.text.secondary}
                                    />
                                    <Text
                                        style={[
                                            styles.listItemText,
                                            {
                                                color: theme.colors.text.primary,
                                                fontFamily: theme.fontFamily.regular,
                                            },
                                        ]}
                                    >
                                        {item.fullName}
                                    </Text>
                                    {selectedPatientId === item.patientId && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={theme.colors.accent}
                                        />
                                    )}
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            {
                                                color: theme.colors.text.tertiary,
                                                fontFamily: theme.fontFamily.regular,
                                            },
                                        ]}
                                    >
                                        No patients found
                                    </Text>
                                </View>
                            }
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                    </Pressable>
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
        fontSize: 14,
        marginBottom: 8,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    leftIcon: {
        marginRight: 12,
    },
    triggerText: {
        flex: 1,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        borderRadius: 16,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        margin: 12,
        marginBottom: 8,
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
    list: {
        maxHeight: 300,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    listItemText: {
        flex: 1,
        fontSize: 16,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});