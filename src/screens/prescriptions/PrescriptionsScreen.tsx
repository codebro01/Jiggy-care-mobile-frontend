/**
 * Jiggy Care Mobile - Prescriptions Screen
 * List of prescriptions with ability to create new ones
 */

import React, { useEffect } from 'react';
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
import { usePrescriptionsStore } from '../../stores/prescriptionsStore';
import { prescriptionService } from '../../services/prescription.service';

type PrescriptionsScreenNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  'PrescriptionsList'
>;

interface Props {
  navigation: PrescriptionsScreenNavigationProp;
}



export function PrescriptionsScreen({ navigation }: Props) {
  const theme = useAppTheme();

  const prescriptions = usePrescriptionsStore((state) => state.prescriptions);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionService.findAll();
      usePrescriptionsStore.setState({ prescriptions: response.data });

      console.log(response);
    } catch (error) {
      console.log(error)
      throw error;
    }
  };

  const renderPrescription = ({ item }: { item: Prescription }) => (
    <Card variant="elevated" style={styles.prescriptionCard}>
      <View style={styles.prescriptionHeader}>
        <Avatar
          name={`${item.patientName}`}
          size="md"
        />
        <View style={styles.prescriptionInfo}>
          <Text
            style={[
              styles.patientName,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            {item.patientName}
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


      <View style={styles.medicationsContainer}>
        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Name ({item.name})
        </Text>
        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Dosage ({item.dosage})
        </Text>

        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Mg ({item.mg})
        </Text>

        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Frequency ({item.frequency})
        </Text>

        <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Pills Remaining ({item.pillsRemaining})
        </Text>

        {item.notes ? (
          <Text
            style={[
              styles.notesText,
              { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
            ]}
            numberOfLines={3}
          >
            Notes: {item.notes}
          </Text>
        ) : null}

        {/* <Text
          style={[
            styles.medicationsLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          Prescribed By ({item.prescribedBy})
        </Text> */}

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
        data={prescriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderPrescription}
        contentContainerStyle={[
          styles.listContent,
          prescriptions.length === 0 && styles.emptyListContent,
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
  notesText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
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
