/**
 * Jiggy Care Mobile - Appointments Screen
 * List of appointments with filter tabs
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { useAppointmentsStore } from '../../stores';
import { Card, Avatar, StatusBadge, EmptyState, SkeletonCard } from '../../components';
import { AppointmentsStackParamList } from '../../navigation/types';
import { Appointment } from '../../types';

type AppointmentsScreenNavigationProp = NativeStackNavigationProp<
  AppointmentsStackParamList,
  'AppointmentsList'
>;

interface Props {
  navigation: AppointmentsScreenNavigationProp;
}

type FilterType = 'upcoming' | 'completed' | 'cancelled' | 'in_progress' | 'pending_confirmation' | 'no_show' | 'stale';

const filters: { key: FilterType; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'in_progress' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'no_show' },
  { key: 'pending_confirmation', label: 'pending_confirmation' },
  { key: 'completed', label: 'Completed' },
  { key: 'stale', label: 'stale' },
];

export function AppointmentsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const {
    appointments,
    isLoading,
    loadAppointments,
    filter,
    setFilter,
    getFilteredAppointments,
  } = useAppointmentsStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const filteredAppointments = getFilteredAppointments();

  // console.log('filter', filteredAppointments)

  const renderFilterTab = ({ key, label }: { key: FilterType; label: string }) => {
    const isActive = filter === key;


    return (
      <Pressable
        key={key}
        onPress={() => setFilter(key)}
        style={[
          styles.filterTab,
          {
            backgroundColor: isActive
              ? theme.colors.accent
              : theme.colors.surface.secondary,
          },
        ]}
      >
        <Text
          style={[
            styles.filterTabText,
            {
              color: isActive
                ? '#FFFFFF'
                : theme.colors.text.secondary,
              fontFamily: theme.fontFamily.medium,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <Card
      variant="elevated"
      onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}
      style={styles.appointmentCard}
    >
      <View style={styles.appointmentHeader}>
        <Avatar
          name={`${item.patientName}`}
          // source={item.patientName}
          size="lg"
          showStatus
          isOnline={item.status === 'confirmed'}
        />
        <View style={styles.appointmentInfo}>
          <Text
            style={[
              styles.patientName,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            {item.patientName}
          </Text>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.text.tertiary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {new Date(item.date).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })},
            </Text>
            <Text
              style={[
                styles.durationText,
                { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {item.duration} hour
            </Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.appointmentFooter}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.text.tertiary} />

        <Pressable onPress={() => navigation.navigate('Chat', { appointment: item })}>
          <Text style={{ color: theme.colors.text.primary }}>
            Start Messaging
          </Text>
        </Pressable>

        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </View>
    </Card>
  );

console.log('appointments', appointments)

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
          Appointments
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContentContainer}
          style={styles.filterScroll}
        >
          {filters.map(renderFilterTab)}
        </ScrollView>
      </View>

      {/* Appointments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard style={styles.skeletonCard} />
          <SkeletonCard style={styles.skeletonCard} />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.bookingId}
          renderItem={renderAppointment}
          contentContainerStyle={[
            styles.listContent,
            filteredAppointments.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No Appointments"
              description={`You don't have any ${filter} appointments`}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 14,
  },
  loadingContainer: {
    paddingHorizontal: 16,
  },
  skeletonCard: {
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    marginBottom: 6,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 13,
    marginLeft: 6,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  appointmentType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTypeText: {
    fontSize: 13,
    marginLeft: 6,
  },
  durationText: {
    fontSize: 13,
    marginLeft: 6,
  },
});
