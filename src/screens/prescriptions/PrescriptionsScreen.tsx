/**
 * Jiggy Care Mobile - Prescriptions Screen
 * List of prescriptions with ability to create new ones
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { Card, Avatar, EmptyState } from '../../components';
import { PrescriptionsStackParamList } from '../../navigation/types';
import { Prescription } from '../../types';

type PrescriptionsScreenNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  'PrescriptionsList'
>;

interface Props {
  navigation: PrescriptionsScreenNavigationProp;
}

// Mock data
const mockPrescriptions: Prescription[] = [
  {
    id: 'rx1',
    patientId: 'p1',
    patient: {
      id: 'p1',
      firstName: 'Victor',
      lastName: 'Damilola',
      email: 'victor@example.com',
    },
    consultantId: 'c1',
    bookingId: 'a3',
    medications: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'Take after meals',
      },
      {
        name: 'Vitamin C',
        dosage: '1000mg',
        frequency: 'Once daily',
        duration: '10 days',
      },
    ],
    diagnosis: 'Common cold with mild fever',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function PrescriptionsScreen({ navigation }: Props) {
  const theme = useAppTheme();

  const renderPrescription = ({ item }: { item: Prescription }) => (
    <Card variant="elevated" style={styles.prescriptionCard}>
      <View style={styles.prescriptionHeader}>
        <Avatar
          name={`${item.patient.firstName} ${item.patient.lastName}`}
          size="md"
        />
        <View style={styles.prescriptionInfo}>
          <Text
            style={[
              styles.patientName,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            {item.patient.firstName} {item.patient.lastName}
          </Text>
          <Text
            style={[
              styles.prescriptionDate,
              { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </View>

      {item.diagnosis && (
        <View style={[styles.diagnosisContainer, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text
            style={[
              styles.diagnosisLabel,
              { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
            ]}
          >
            Diagnosis
          </Text>
          <Text
            style={[
              styles.diagnosisText,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {item.diagnosis}
          </Text>
        </View>
      )}

      <View style={styles.medicationsContainer}>
        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Medications ({item.medications.length})
        </Text>
        {item.medications.slice(0, 2).map((med, index) => (
          <View key={index} style={styles.medicationItem}>
            <Ionicons name="medical" size={16} color={theme.colors.accent} />
            <Text
              style={[
                styles.medicationName,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              {med.name}
            </Text>
            <Text
              style={[
                styles.medicationDosage,
                { color: theme.colors.text.secondary },
              ]}
            >
              {med.dosage}
            </Text>
          </View>
        ))}
        {item.medications.length > 2 && (
          <Text
            style={[
              styles.moreText,
              { color: theme.colors.accent },
            ]}
          >
            +{item.medications.length - 2} more
          </Text>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Prescriptions
        </Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => navigation.navigate('CreatePrescription', {})}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={mockPrescriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderPrescription}
        contentContainerStyle={[
          styles.listContent,
          mockPrescriptions.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="medical-outline"
            title="No Prescriptions"
            description="You haven't created any prescriptions yet"
            actionLabel="Create Prescription"
            onAction={() => navigation.navigate('CreatePrescription', {})}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  prescriptionCard: {
    marginBottom: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
  },
  prescriptionDate: {
    fontSize: 13,
    marginTop: 2,
  },
  diagnosisContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  diagnosisLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
  },
  medicationsContainer: {
    marginTop: 12,
  },
  medicationsLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  medicationName: {
    fontSize: 14,
    marginLeft: 8,
  },
  medicationDosage: {
    fontSize: 13,
    marginLeft: 8,
  },
  moreText: {
    fontSize: 13,
    marginTop: 4,
  },
});
