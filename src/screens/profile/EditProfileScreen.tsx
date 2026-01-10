/**
 * Jiggy Care Mobile - Edit Profile Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuthStore } from '../../stores';
import { Avatar, Button, Input } from '../../components';
import { ProfileStackParamList } from '../../navigation/types';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'EditProfile'
>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

export function EditProfileScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);

  // Basic Information
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');

  // Professional Information (Consultant)
  const [about, setAbout] = useState(user?.about || '');
  const [speciality, setSpeciality] = useState(user?.speciality || '');
  const [certification, setCertification] = useState(user?.certification || '');
  const [yrsOfExperience, setYrsOfExperience] = useState(user?.yrsOfExperience?.toString() || '');
  const [workingHours, setWorkingHours] = useState(user?.workingHours || '');

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // TODO: Call your backend API to update profile
      // await profileService.updateProfile({...formData});

      // Update local auth store
      // updateUser({...updatedData});

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
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
          Edit Profile
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            name={fullName}
            source={user?.avatar}
            size="2xl"
          />
          <Pressable
            style={[styles.changePhotoButton, { backgroundColor: theme.colors.accent }]}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Basic Information Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          BASIC INFORMATION
        </Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            leftIcon="person-outline"
          />

          <Input
            label="Email"
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            editable={false}
          />

          <Input
            label="Phone"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Address"
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
            leftIcon="location-outline"
          />

          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            leftIcon="calendar-outline"
          />

          <Input
            label="Gender"
            placeholder="Male/Female/Other"
            value={gender}
            onChangeText={setGender}
            leftIcon="male-female-outline"
          />
        </View>

        {/* Professional Information Section - Only for Consultants */}
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

            <View style={styles.form}>
              <Input
                label="About"
                placeholder="Brief description about yourself"
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={4}
                leftIcon="information-circle-outline"
              />

              <Input
                label="Specialization"
                placeholder="e.g., Cardiology, Pediatrics"
                value={speciality}
                onChangeText={setSpeciality}
                leftIcon="medical-outline"
              />

              <Input
                label="Certification"
                placeholder="Your certifications"
                value={certification}
                onChangeText={setCertification}
                leftIcon="school-outline"
              />

              <Input
                label="Years of Experience"
                placeholder="Enter years"
                value={yrsOfExperience}
                onChangeText={setYrsOfExperience}
                keyboardType="numeric"
                leftIcon="time-outline"
              />

              <Input
                label="Working Hours"
                placeholder="e.g., Mon-Fri 9AM-5PM"
                value={workingHours}
                onChangeText={setWorkingHours}
                leftIcon="briefcase-outline"
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading}
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
    paddingBottom: 140,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  form: {
    marginBottom: 16,
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