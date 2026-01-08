/**
 * Jiggy Care Mobile - Profile Screen
 * User profile and settings
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
              name={`${user?.firstName} ${user?.lastName}`}
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
                Dr. {user?.firstName} {user?.lastName}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {user?.email}
              </Text>
              {user?.specialization && (
                <View style={[styles.specializationBadge, { backgroundColor: theme.colors.palette.primary[50] }]}>
                  <Text
                    style={[
                      styles.specializationText,
                      { color: theme.colors.accent },
                    ]}
                  >
                    {user.specialization}
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

        {/* Settings Sections */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          ACCOUNT
        </Text>
        <Card variant="outlined" style={styles.settingsCard}>
          <SettingItem icon="person-outline" label="Personal Information" />
          <SettingItem icon="notifications-outline" label="Notifications" />
          <SettingItem icon="shield-checkmark-outline" label="Privacy & Security" />
        </Card>

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
});
