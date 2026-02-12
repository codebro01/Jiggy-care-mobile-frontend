/**
 * Jiggy Care Mobile - Home Screen
 * Dashboard with stats, upcoming appointments, and quick actions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuthStore, useAppointmentsStore } from '../../stores';
import { Card, Avatar, Badge, StatusBadge, SkeletonCard } from '../../components';
import { HomeStackParamList } from '../../navigation/types';
import { Appointment } from '../../types';
import { homeService } from '../../services/home.service';
import { appointmentService } from '../../services/appointment.service';
import { useNotificationStore } from '../../stores/notificationStore';
import * as Notifications from 'expo-notifications';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export function HomeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const {
    appointments,
    isLoading,
    loadAppointments
  } = useAppointmentsStore();

  const unreadCount = useNotificationStore(state => state.unreadCount);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission denied');
      }
    };
    requestPermissions();
  }, []);

  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoadingHomeData, setIsLoadingHomeData] = React.useState(true);
  const [upcoming, setUpcoming] = React.useState(0);
  const [completed, setCompleted] = React.useState(0);
  const [averageRating, setAverageRating] = React.useState(0);

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAppointments(),
      fetchHomeScreenData(),
    ]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'upcoming'
  );

  // console.log('upcomingAppointments', upcomingAppointments)

  useEffect(() => {
    fetchHomeScreenData();
  }, []);
  // useEffect(() => {
  //   fetchAppointments();
  // }, []);




  console.log(user)
  const fetchHomeScreenData = async () => {
    try {
      setIsLoadingHomeData(true);
      const response = await homeService.fetchHomeData();
      setUpcoming(response.data.noOfUpcomingBookings.total);
      setCompleted(response.data.noOfCompletedBookings.total);
      setAverageRating(response.data.averageRating.total);
    } catch (error) {
      console.log(error);
      console.error('Failed to fetch home screen data:', error);
    } finally {
      setIsLoadingHomeData(false);
    }
  };

  // const fetchAppointments = async () => {
  //   try {
  //     const response = await appointmentService.upcomingAppointments();
  //     console.log(response)
  //     setAppointments(response.data)
  //   } catch (error) {
  //     console.log(error)
  //     console.error('Failed to fetch appointments:', error);
  //   }
  // }

  // console.log('appointments', appointments)

  const handleViewAllAppointments = () => {
    // Navigate to the Appointments tab
    // We use getParent() to access the TabNavigator
    navigation.getParent()?.navigate('Appointments' as any);
  };

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: keyof typeof Ionicons.glyphMap,
    accentColor: string

  ) => (
    <View
      style={[styles.statCard, { backgroundColor: theme.colors.surface.primary }]}
    >
      <View style={styles.statBackgroundIcon}>
        <Ionicons name={icon} size={100} color={accentColor} style={{ opacity: 0.08 }} />
      </View>

      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.text.secondary }]}>{title}</Text>
      </View>

      <View style={[styles.statIconBadge, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
    </View>
  );

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card
      key={appointment.bookingId}
      variant="elevated"
      style={styles.appointmentCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfoContainer}>
          <Avatar
            name={`${appointment.patientName}`}
            size="lg"
            showStatus
            isOnline={appointment.status === 'confirmed'}
          />
          <View style={styles.appointmentInfo}>
            <Text
              style={[
                styles.patientName,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {appointment.patientName}
            </Text>
            <Text
              style={[
                styles.patientLabel,
                { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium }
              ]}
            >
              Patient
            </Text>
          </View>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border.secondary }]} />

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.palette.primary[50] }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.palette.primary[500]} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium }]}>Date</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold }]}>
              {new Date(appointment.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.palette.warning[50] }]}>
            <Ionicons name="time-outline" size={20} color={theme.colors.palette.warning[500]} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary, fontFamily: theme.fontFamily.medium }]}>Time</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold }]}>
              {new Date(appointment.date).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'UTC'
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.colors.surface.secondary, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={handleViewAllAppointments}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.greeting,
                { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {getGreeting()},
            </Text>
            <Text
              style={[
                styles.userName,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {user?.prefix} {user?.fullName || 'N/A'}
            </Text>
          </View>
          <Pressable
            style={[styles.notificationButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            {unreadCount > 0 && <Badge count={unreadCount} style={styles.notificationBadge} />}
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {isLoadingHomeData ? (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface.secondary }]}>
                <View style={[styles.statIconBadge, { backgroundColor: theme.colors.surface.elevated }]} />
                <View style={{ width: 40, height: 24, backgroundColor: theme.colors.surface.elevated, borderRadius: 4, marginBottom: 4 }} />
                <View style={{ width: 60, height: 12, backgroundColor: theme.colors.surface.elevated, borderRadius: 4 }} />
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface.secondary }]}>
                <View style={[styles.statIconBadge, { backgroundColor: theme.colors.surface.elevated }]} />
                <View style={{ width: 40, height: 24, backgroundColor: theme.colors.surface.elevated, borderRadius: 4, marginBottom: 4 }} />
                <View style={{ width: 60, height: 12, backgroundColor: theme.colors.surface.elevated, borderRadius: 4 }} />
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface.secondary }]}>
                <View style={[styles.statIconBadge, { backgroundColor: theme.colors.surface.elevated }]} />
                <View style={{ width: 40, height: 24, backgroundColor: theme.colors.surface.elevated, borderRadius: 4, marginBottom: 4 }} />
                <View style={{ width: 60, height: 12, backgroundColor: theme.colors.surface.elevated, borderRadius: 4 }} />
              </View>
            </>
          ) : (
            <>
              {renderStatCard(
                'Upcoming',
                upcoming,
                'calendar',
                theme.colors.palette.primary[600]
              )}
              {renderStatCard(
                'Completed',
                completed,
                'checkmark-circle',
                theme.colors.palette.success[600]
              )}
              {renderStatCard(
                'Rating',
                averageRating === null ? 0 : Number(averageRating).toFixed(1),
                'star',
                theme.colors.palette.warning[600]
              )}
            </>
          )}
        </View>


        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Upcoming Appointments
            </Text>
            <Pressable onPress={handleViewAllAppointments}>
              <Text style={[styles.seeAll, { color: theme.colors.accent }]}>
                See all
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <>
              <SkeletonCard style={{ marginBottom: 12 }} />
              <SkeletonCard />
            </>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(renderAppointmentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={theme.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.colors.text.tertiary },
                ]}
              >
                No upcoming appointments
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    marginTop: 2,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    height: 120,
    padding: 16,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statBackgroundIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }],
  },
  statContent: {
    zIndex: 1,
    marginTop: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statIconBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  appointmentCard: {
    marginBottom: 20,
    padding: 0,
    borderRadius: 24,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    marginBottom: 4,
  },
  patientLabel: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
  appointmentDetails: {
    padding: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
  },
  cardFooter: {
    padding: 12,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
  },
});
