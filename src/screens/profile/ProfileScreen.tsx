/**
 * Jiggy Care Mobile - Profile Screen
 * User profile overview with settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, useTheme } from '../../theme';
import { useAuthStore } from '../../stores';
import { Avatar, Card } from '../../components';
import { ProfileStackParamList } from '../../navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileMain'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  hasChevron?: boolean;
  onPress?: () => void;
  isDanger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { toggleTheme, themeMode } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const SettingItem = ({
    icon,
    label,
    value,
    hasChevron = true,
    onPress,
    isDanger = false,
    toggle = false,
    toggleValue,
    onToggle,
  }: SettingItemProps) => (
    <Pressable
      style={[
        styles.settingItem,
        { borderBottomColor: theme.colors.border.primary },
      ]}
      onPress={onPress}
      disabled={toggle}
    >
      <View
        style={[
          styles.settingIconContainer,
          {
            backgroundColor: isDanger
              ? theme.colors.palette.error[50]
              : theme.colors.surface.secondary,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isDanger ? theme.colors.palette.error[500] : theme.colors.accent}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingLabel,
            {
              color: isDanger ? theme.colors.palette.error[500] : theme.colors.text.primary,
              fontFamily: theme.fontFamily.medium,
            },
          ]}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={[
              styles.settingValue,
              { color: theme.colors.text.tertiary },
            ]}
          >
            {value}
          </Text>
        )}
      </View>
      {toggle && onToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{
            false: theme.colors.surface.secondary,
            true: theme.colors.palette.primary[400],
          }}
          thumbColor="#FFFFFF"
        />
      ) : hasChevron ? (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={[
            styles.title,
            { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Profile
        </Text>

        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.fullName || 'User'}
              source={user?.avatar}
              size="xl"
            />
            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {user?.role === 'consultant' && 'Dr. '}{user?.fullName}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {user?.email}
              </Text>
              {user?.speciality && (
                <View style={[styles.specializationBadge, { backgroundColor: theme.colors.palette.primary[50] }]}>
                  <Text
                    style={[
                      styles.specializationText,
                      { color: theme.colors.accent },
                    ]}
                  >
                    {user.speciality}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Pressable
            style={[styles.editButton, { borderColor: theme.colors.border.primary }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text
              style={[styles.editButtonText, { color: theme.colors.accent }]}
            >
              Edit Profile
            </Text>
          </Pressable>
        </Card>

        {/* Personal Information */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          PERSONAL INFORMATION
        </Text>
        <Card variant="outlined" style={styles.settingsCard}>
          <SettingItem
            icon="call-outline"
            label="Phone"
            value={user?.phone || 'Not set'}
            hasChevron={false}
          />
          <SettingItem
            icon="location-outline"
            label="Address"
            value={user?.address || 'Not set'}
            hasChevron={false}
          />
          <SettingItem
            icon="calendar-outline"
            label="Date of Birth"
            value={user?.dateOfBirth || 'Not set'}
            hasChevron={false}
          />
          <SettingItem
            icon="male-female-outline"
            label="Gender"
            value={user?.gender || 'Not set'}
            hasChevron={false}
          />
        </Card>

        {/* Professional Information - Only for consultants */}
        {user?.role === 'consultant' && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              PROFESSIONAL INFORMATION
            </Text>
            <Card variant="outlined" style={styles.settingsCard}>
              {user?.about && (
                <View style={styles.aboutSection}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="briefcase-outline" size={20} color={theme.colors.accent} />
                  </View>

                  <View style={styles.settingContent}>
                    <Text
                      style={[
                        styles.aboutLabel,
                        { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.medium },
                      ]}
                    >
                      About
                    </Text>

                    <Text
                      style={[
                        styles.aboutText,
                        { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular },
                      ]}
                    >
                      {user.about}
                    </Text>
                  </View>
                  
                 
                </View>
              )}
              <SettingItem
                icon="school-outline"
                label="Certification"
                value={user?.certification || 'Not set'}
                hasChevron={false}
              />
              <SettingItem
                icon="time-outline"
                label="Years of Experience"
                value={user?.yrsOfExperience ? `${user.yrsOfExperience} years` : 'Not set'}
                hasChevron={false}
              />
              <View style={styles.workingHoursSection}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.workingHoursContent}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: theme.colors.text.primary, fontFamily: theme.fontFamily.medium },
                    ]}
                  >
                    Working Hours
                  </Text>
                  {user?.workingHours && typeof user.workingHours === 'object' ? (
                    <View style={styles.workingHoursList}>
                      {Object.entries(user.workingHours).map(([day, hours]) => (
                        <Text
                          key={day}
                          style={[
                            styles.workingHoursItem,
                            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                          ]}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}: {'hours'}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.settingValue, { color: theme.colors.text.tertiary }]}>
                      Not set
                    </Text>
                  )}
                </View>
              </View>
              <SettingItem
                icon={user?.availability ? "checkmark-circle" : "close-circle"}
                label="Availability"
                value={user?.availability ? 'Available' : 'Not Available'}
                hasChevron={false}
              />
            </Card>
          </>
        )}

        {/* Account Information */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          ACCOUNT
        </Text>
        <Card variant="outlined" style={styles.settingsCard}>
          <SettingItem
            icon={user?.emailVerified ? "shield-checkmark" : "shield-outline"}
            label="Email Verification"
            value={user?.emailVerified ? 'Verified' : 'Not Verified'}
            hasChevron={false}
          />
          <SettingItem
            icon="calendar-outline"
            label="Member Since"
            value={user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'N/A'}
            hasChevron={false}
          />
        </Card>

        {/* Settings Sections */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          APPEARANCE
        </Text>
        <Card variant="outlined" style={styles.settingsCard}>
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            toggle
            toggleValue={themeMode === 'dark'}
            onToggle={toggleTheme}
          />
        </Card>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          SUPPORT
        </Text>
        <Card variant="outlined" style={styles.settingsCard}>
          <SettingItem icon="help-circle-outline" label="Help & Support" />
          <SettingItem icon="document-text-outline" label="Terms of Service" />
          <SettingItem icon="information-circle-outline" label="About" value="v1.0.0" />
        </Card>

        <Card variant="outlined" style={[styles.settingsCard, styles.logoutCard]}>
          <SettingItem
            icon="log-out-outline"
            label="Log Out"
            isDanger
            hasChevron={false}
            onPress={logout}
          />
        </Card>
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
  title: {
    fontSize: 28,
    marginTop: 16,
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  specializationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 15,
  },
  settingValue: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutCard: {
    borderWidth: 0,
  },
  aboutSection: {
    marginBottom: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 14,
    marginTop: 2,
  },
  workingHoursSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  workingHoursContent: {
    flex: 1,
    marginLeft: 12,
  },
  workingHoursItem: {
    fontSize: 13,
    marginTop: 2,
  },
  workingHoursList: {
    marginTop: 8,
  },
});