/**
 * Jiggy Care Mobile - Create Prescription Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { Button, Input, Card } from '../../components';
import { PrescriptionsStackParamList } from '../../navigation/types';

type CreatePrescriptionScreenNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  'CreatePrescription'
>;

interface Props {
  navigation: CreatePrescriptionScreenNavigationProp;
}

interface MedicationField {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export function CreatePrescriptionScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<MedicationField[]>([
    { id: '1', name: '', dosage: '', frequency: '', duration: '' },
  ]);

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now().toString(), name: '', dosage: '', frequency: '', duration: '' },
    ]);
  };

  const updateMedication = (id: string, field: keyof MedicationField, value: string) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const handleSubmit = () => {
    // TODO: Implement prescription creation
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.closeButton, { backgroundColor: theme.colors.surface.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          New Prescription
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient */}
        <Input
          label="Patient Name"
          placeholder="Search patient..."
          value={patientName}
          onChangeText={setPatientName}
          leftIcon="search-outline"
        />

        {/* Diagnosis */}
        <Input
          label="Diagnosis"
          placeholder="Enter diagnosis..."
          value={diagnosis}
          onChangeText={setDiagnosis}
          multiline
          numberOfLines={3}
        />

        {/* Medications */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Medications
          </Text>
          <Pressable
            style={[styles.addMedButton, { backgroundColor: theme.colors.palette.primary[50] }]}
            onPress={addMedication}
          >
            <Ionicons name="add" size={18} color={theme.colors.accent} />
            <Text
              style={[styles.addMedText, { color: theme.colors.accent }]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        {medications.map((med, index) => (
          <Card
            key={med.id}
            variant="outlined"
            style={styles.medicationCard}
          >
            <View style={styles.medicationHeader}>
              <Text
                style={[
                  styles.medicationNumber,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Medication {index + 1}
              </Text>
              {medications.length > 1 && (
                <Pressable onPress={() => removeMedication(med.id)}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.palette.error[500]} />
                </Pressable>
              )}
            </View>

            <Input
              label="Medication Name"
              placeholder="e.g., Paracetamol"
              value={med.name}
              onChangeText={(value) => updateMedication(med.id, 'name', value)}
              containerStyle={styles.medInput}
            />
            <View style={styles.medRow}>
              <View style={styles.medInputHalf}>
                <Input
                  label="Dosage"
                  placeholder="e.g., 500mg"
                  value={med.dosage}
                  onChangeText={(value) => updateMedication(med.id, 'dosage', value)}
                  containerStyle={styles.medInput}
                />
              </View>
              <View style={styles.medInputHalf}>
                <Input
                  label="Frequency"
                  placeholder="e.g., Twice daily"
                  value={med.frequency}
                  onChangeText={(value) => updateMedication(med.id, 'frequency', value)}
                  containerStyle={styles.medInput}
                />
              </View>
            </View>
            <Input
              label="Duration"
              placeholder="e.g., 5 days"
              value={med.duration}
              onChangeText={(value) => updateMedication(med.id, 'duration', value)}
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>
        ))}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
        <Button
          title="Create Prescription"
          onPress={handleSubmit}
          fullWidth
        />
      </View>
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
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  addMedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addMedText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  medicationCard: {
    marginBottom: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  medicationNumber: {
    fontSize: 13,
  },
  medInput: {
    marginBottom: 8,
  },
  medRow: {
    flexDirection: 'row',
    gap: 12,
  },
  medInputHalf: {
    flex: 1,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
