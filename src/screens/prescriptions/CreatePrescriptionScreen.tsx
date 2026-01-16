/**
 * Jiggy Care Mobile - Create Prescription Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { Button, Input, Card } from '../../components';
import { PrescriptionsStackParamList } from '../../navigation/types';
import { prescriptionService } from '@/services/prescription.service';
import { PatientDropdown } from '@/screens/prescriptions/patientDropdown';
import { FrequencyDropdown } from '@/screens/prescriptions/FrequencyDropdown';
import { usePrescriptionsStore } from '@/stores/prescriptionsStore';

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
  dosage: number;
  frequency: string;
  duration: string;
  mg: number;
}

export function CreatePrescriptionScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [medications, setMedications] = useState<MedicationField[]>([
    { id: '1', name: '', dosage: 2, frequency: '', duration: '', mg: 500 },
  ]);
  const [patients, setPatients] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getConsultantPatients();
  }, []);

  const getConsultantPatients = async () => {
    try {
      const response = await prescriptionService.getConsultantPatients();
      console.log(response);
      setPatients(response.data);
    } catch (error) {
      console.log(error)
      throw error;
    }
  }

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now().toString(), name: '', dosage: 0, frequency: '', duration: '', mg: 0 },
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

  const handleSubmit = async () => {
    if (!patientId) {
      alert('Please select a patient');
      return;
    }

    if (medications.some(m => !m.name || !m.dosage || !m.frequency)) {
      alert('Please fill in all medication details');
      return;
    }

    try {
      setIsSubmitting(true);

      const prescriptions = medications.map(med => ({
        patientId,
        name: med.name,
        duration: Number(med.duration), 
        dosage: Number(med.dosage), // Default dosage count (e.g. 1 pill)
        mg: Number(med.mg), // Dosage strength from form
        frequency: med.frequency,
        startDate: new Date().toISOString().split('T')[0], // format YYYY-MM-DD
      }));


      const response = await prescriptionService.createManyPrescriptions({ patientId, prescriptions });

      if (response.success && Array.isArray(response.data)) {

        const newPrescriptions = response.data.map((prescription: any) => ({
          ...prescription,
          patientName: patientName,
        }));
        usePrescriptionsStore.getState().addPrescriptions(newPrescriptions);
      }
      console.log('created prescriptions', response.data)

      navigation.goBack();
    } catch (error) {
      console.error('Failed to create prescription:', error);
      alert('Failed to create prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        <PatientDropdown
          patients={patients}
          selectedPatientId={patientId}
          onSelectPatient={(id, name) => {
            setPatientId(id);
            setPatientName(name);
          }}
          label="Patient Name"
          placeholder="Select patient..."
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

            <Input
              label="Duration"
              placeholder="e.g., 5 days"
              value={med.duration}
              onChangeText={(value) => updateMedication(med.id, 'duration', value)}
              containerStyle={{ marginBottom: 0 }}
            />

            <FrequencyDropdown
              value={med.frequency}
              onSelect={(value) => updateMedication(med.id, 'frequency', value)}
              placeholder="Select..."
              containerStyle={styles.medInput}
            />
            <View style={styles.medRow}>
              <View style={styles.medInputHalf}>
                <Input
                  label="Mg"
                  placeholder="e.g., 500"
                  keyboardType="numeric"
                  value={med.mg.toString()}
                  onChangeText={(value) => updateMedication(med.id, 'mg', value)}
                  containerStyle={styles.medInput}
                />
              </View>
              <View style={styles.medInputHalf}>
                <Input
                  label="Dosage"
                  placeholder="e.g., 2"
                  keyboardType="numeric"
                  value={med.dosage.toString()}
                  onChangeText={(value) => updateMedication(med.id, 'dosage', value)}
                  containerStyle={styles.medInput}
                />
              </View>
          
            </View>
        
          </Card>
        ))}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[
        styles.bottomAction,
        {
          backgroundColor: theme.colors.background.primary,
          paddingBottom: Math.max(insets.bottom + 16, 24)
        }
      ]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: '#0469A8', opacity: pressed || isSubmitting ? 0.8 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create Prescription</Text>
          )}
        </Pressable>
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
  submitButton: {
    paddingVertical: 12,
    marginBottom: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
