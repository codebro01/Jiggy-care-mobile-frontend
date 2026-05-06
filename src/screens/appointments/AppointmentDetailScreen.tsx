/**
 * Jiggy Care Mobile - Appointment Detail Screen
 * Shows patient details and allows starting chat
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert as RNAlert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Avatar, Button, Card, StatusBadge } from '../../components';
import { AppointmentsStackParamList, RootStackParamList } from '../../navigation/types';
import { appointmentService } from '../../services/appointment.service';
import { useAlert, Alert } from '@/components/alert';
import { Appointment } from '../../types';



type AppointmentDetailScreenNavigationProp = NativeStackNavigationProp<
  AppointmentsStackParamList & RootStackParamList,
  'AppointmentDetail'
>;
type AppointmentDetailScreenRouteProp = RouteProp<
  AppointmentsStackParamList & RootStackParamList,
  'AppointmentDetail'
>;

interface Props {
  navigation: AppointmentDetailScreenNavigationProp;
  route: AppointmentDetailScreenRouteProp;
}

export function AppointmentDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const [appointment, setAppointment] = useState<Appointment | null>(
    route.params?.appointment || null
  );
  const [isLoading, setIsLoading] = useState(!route.params?.appointment);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();

  // Fetch appointment by bookingId when navigated from push notification
  useEffect(() => {
    const bookingId = route.params?.bookingId;
    if (!route.params?.appointment && bookingId) {
      fetchAppointmentById(bookingId);
    }
  }, [route.params]);

  const fetchAppointmentById = async (bookingId: string) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await appointmentService.getBookingById(bookingId);
      setAppointment(response.data || response);
    } catch (error: any) {
      console.error('Failed to fetch appointment:', error);
      setLoadError('Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!appointment) return;
    navigation.navigate('Chat', { appointment });
  };

  const openCompleteModal = () => {
    setNotes('');
    setIsCompleteModalVisible(true);
  };

  const closeCompleteModal = () => {
    setIsCompleteModalVisible(false);
    setNotes('');
  };

  const submitCompletion = async () => {
    if (!notes.trim()) {
      showError('Error', 'Please enter notes for the appointment');
      return;
    }
    if (!appointment) return;

    try {
      setIsSubmitting(true);
      await appointmentService.completeAppointment(appointment.bookingId, notes);
      setIsSubmitting(false);
      closeCompleteModal();
      showSuccess('Success', 'Appointment marked as completed');
      navigation.goBack();
    } catch (error:any) {
      console.log(error);
      setIsSubmitting(false);
      showError('Error', error.message);
    }
  };

  const confirmNoShow = () => {
    RNAlert.alert(
      'Mark as No Show',
      'Are you sure you want to mark this appointment as a No Show? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Mark No Show',
          style: 'destructive',
          onPress: handleMarkNoShow,
        },
      ]
    );
  };

  const handleMarkNoShow = async () => {
    if (!appointment) return;
    try {
      await appointmentService.markNoShow(appointment.bookingId);
      showSuccess('Success', 'Appointment marked as no show');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      showError('Error', 'Failed to mark appointment as no show');
    }
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

  console.log("appointment dataa", appointment);

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

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular }]}>
            Loading appointment details...
          </Text>
        </View>
      )}

      {/* Error State */}
      {!isLoading && loadError && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.tertiary} />
          <Text style={[styles.errorText, { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.medium }]}>
            {loadError}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => {
              const bookingId = route.params?.bookingId;
              if (bookingId) fetchAppointmentById(bookingId);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Content - only render when appointment is available */}
      {!isLoading && !loadError && appointment && (
      <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Card */}
        <Card variant="elevated" style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <Avatar
              name={`${appointment.patientName}`}
              // source={appointment.patientName}
              size="xl"
            />
            <View style={styles.patientInfo}>
              <Text
                style={[
                  styles.patientName,
                  { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {appointment.patientName}
              </Text>
              {/* <Text
                style={[
                  styles.patientEmail,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {appointment.patient.email}
              </Text> */}
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
          <InfoRow icon="time" label="Time" value={new Date(appointment.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} />
          <InfoRow icon="hourglass" label="Duration" value={`${appointment.duration} hour`} />
          {appointment.symptoms ? (
            <InfoRow icon="document-text" label="Symptoms" value={appointment.symptoms} />
          ) : null}
          {/* <InfoRow
            icon={
              appointment.type === 'video'
                ? 'videocam'
                : appointment.type === 'audio'
                ? 'call'
                : 'chatbubble'
            }
            label="Type"
            value={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) + ' Consultation'}
          /> */}
        </Card>
        <View>
          <Pressable
            style={styles.startChatButton}
            onPress={() => navigation.navigate('Chat', { appointment })}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={'#fff'}
            />
            <Text style={styles.startChatButtonText}>Start Messaging</Text>
          </Pressable>

          <View style={styles.actionButtonsContainer}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#4CAF50', flex: 1, marginRight: 8 }]}
              onPress={openCompleteModal}
            >
              <Text style={styles.actionButtonText}>Complete Appointment</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#F44336', flex: 1, marginLeft: 8 }]}
              onPress={confirmNoShow}
            >
              <Text style={styles.actionButtonText}>Mark No Show</Text>
            </Pressable>
          </View>
        </View>


        {/* Notes */}
        {/* {appointment.notes && (
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
        )} */}
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
      <Alert
        type={alert.type}
        message={alert.message}
        title={alert.title}
        visible={alert.visible}
        onClose={hideAlert}
      />

      {/* Completion Modal */}
      <Modal
        visible={isCompleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCompleteModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface.primary }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold }]}>
                Complete Appointment
              </Text>

              <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                Please add any notes or summary for this appointment before completing it.
              </Text>

              {/* Use standard TextInput for now to ensure multiline works well in modal */}
              <View style={[styles.notesInputContainer, { backgroundColor: theme.colors.surface.secondary, borderColor: theme.colors.border.primary }]}>
                <TextInput
                  style={[styles.notesInput, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular }]}
                  placeholder="Enter appointment notes..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={closeCompleteModal}
                  style={styles.modalButton}
                />
                <Button
                  title="Submit"
                  variant="primary"
                  onPress={submitCompletion}
                  loading={isSubmitting}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
      </>
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
    flex: 1,
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



  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // Space between icon and text
    paddingHorizontal: 16,
    paddingVertical: 12, // Increased padding
    backgroundColor: '#2196F3', // Blue color
    borderRadius: 12,
    marginBottom: 16, // Reduced margin
  },
  startChatButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  notesInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    marginBottom: 20,
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
