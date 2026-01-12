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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuthStore, useAppointmentsStore } from '../../stores';
import { Card, Avatar, Badge, StatusBadge, SkeletonCard } from '../../components';
import { HomeStackParamList } from '../../navigation/types';
import { Appointment } from '../../types';
import { homeService } from '../../services/home.service';
import {appointmentService} from '../../services/appointment.service';

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
    loadAppointments,
  } = useAppointmentsStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [upcoming, setUpcoming] = React.useState(0);
  const [completed, setCompleted] = React.useState(0);    
  const [averageRating, setAverageRating] = React.useState(0);

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'confirmed' || apt.status === 'pending'
  ).slice(0, 3);

  useEffect(() => {
    fetchHomeScreenData();
  }, []);


  const fetchHomeScreenData = async () => {
    try {
     const response = await homeService.fetchHomeData();
      console.log(response)
      setUpcoming(response.data.noOfUpcomingBookings.total);
      setCompleted(response.data.noOfCompletedBookings.total);
      setAverageRating(response.data.averageRating.total);

    } catch (error) {
      console.log(error)

      console.error('Failed to fetch home screen data:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.upcomingAppointments();
      console.log(response)
    } catch (error) {
      console.log(error)
      console.error('Failed to fetch appointments:', error);
    }
  }

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: keyof typeof Ionicons.glyphMap,
    gradient: [string, string, ...string[]]
  ) => (
    <LinearGradient
      colors={gradient}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card
      key={appointment.appointmentId}
      variant="elevated"
      style={styles.appointmentCard}
    >
      <View style={styles.appointmentHeader}>
        <Avatar
          name={`${appointment.patientName}`}
          source={appointment.patientName}
          size="md"
          showStatus
          isOnline={appointment.status === 'confirmed'}
        />
        <View style={styles.appointmentInfo}>
          <Text
            style={[
              styles.patientName,
              { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            {appointment.patientName} 
          </Text>
          <Text
            style={[
              styles.appointmentTime,
              { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {new Date(appointment.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}{' '}
            at {appointment.date}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
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
              Dr. {user?.fullName || 'N/A'}
            </Text>
          </View>
          <Pressable
            style={[styles.notificationButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <Badge count={3} style={styles.notificationBadge} />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Upcoming',
            upcoming,
            'calendar',
            [theme.colors.palette.primary[500], theme.colors.palette.primary[400]]
          )}
          {renderStatCard(
            'Completed',
            completed,
            'checkmark-circle',
            [theme.colors.palette.success[500], theme.colors.palette.success[400]]
          )}
          {renderStatCard(
            'Rating',
            averageRating === null ? 0 : averageRating.toFixed(1), 
            'star',
            [theme.colors.palette.warning[500], theme.colors.palette.warning[400]]
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
            <Pressable>
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
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
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
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
  },
  appointmentTime: {
    fontSize: 13,
    marginTop: 2,
  },
  appointmentFooter: {
    marginTop: 12,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
  },
});
