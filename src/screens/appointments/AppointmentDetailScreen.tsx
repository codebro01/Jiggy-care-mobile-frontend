/**
 * Jiggy Care Mobile - Appointment Detail Screen
 * Shows patient details and allows starting chat
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Avatar, Button, Card, StatusBadge } from '../../components';
import { AppointmentsStackParamList } from '../../navigation/types';

type AppointmentDetailScreenNavigationProp = NativeStackNavigationProp<
  AppointmentsStackParamList,
  'AppointmentDetail'
>;
type AppointmentDetailScreenRouteProp = RouteProp<
  AppointmentsStackParamList,
  'AppointmentDetail'
>;

interface Props {
  navigation: AppointmentDetailScreenNavigationProp;
  route: AppointmentDetailScreenRouteProp;
}

export function AppointmentDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { appointment } = route.params;

  const handleStartChat = () => {
    navigation.navigate('Chat', { appointment });
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }) => (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIconContainer,
          { backgroundColor: theme.colors.surface.secondary },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text
          style={[
            styles.infoLabel,
            { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.infoValue,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.colors.surface.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          Appointment Details
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Card */}
        <Card variant="elevated" style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <Avatar
              name={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
              source={appointment.patient.avatar}
              size="xl"
            />
            <View style={styles.patientInfo}>
              <Text
                style={[
                  styles.patientName,
                  { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {appointment.patient.firstName} {appointment.patient.lastName}
              </Text>
              <Text
                style={[
                  styles.patientEmail,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {appointment.patient.email}
              </Text>
              <StatusBadge status={appointment.status} style={styles.statusBadge} />
            </View>
          </View>
        </Card>

        {/* Appointment Info */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          Appointment Information
        </Text>
        
        <Card variant="outlined" style={styles.infoCard}>
          <InfoRow
            icon="calendar"
            label="Date"
            value={new Date(appointment.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <InfoRow icon="time" label="Time" value={appointment.time} />
          <InfoRow icon="hourglass" label="Duration" value={`${appointment.duration} minutes`} />
          <InfoRow
            icon={
              appointment.type === 'video'
                ? 'videocam'
                : appointment.type === 'audio'
                ? 'call'
                : 'chatbubble'
            }
            label="Type"
            value={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) + ' Consultation'}
          />
        </Card>

        {/* Notes */}
        {appointment.notes && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Notes
            </Text>
            <Card variant="filled" style={styles.notesCard}>
              <Text
                style={[
                  styles.notesText,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {appointment.notes}
              </Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
          <Button
            title="Start Chat"
            onPress={handleStartChat}
            fullWidth
            icon={<Ionicons name="chatbubble" size={18} color="#FFFFFF" />}
          />
        </View>
      )}
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
  backButton: {
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
  patientCard: {
    marginBottom: 24,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 20,
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  infoCard: {
    marginBottom: 24,
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  notesCard: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
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
