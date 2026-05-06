/**
 * Jiggy Care Mobile - Edit Profile Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { WorkingHoursEditor } from './WorkingHoursEditor';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme';
import { useAuthStore } from '../../stores';
import { Avatar, Button, Input, Dropdown } from '../../components';
import { ProfileStackParamList } from '../../navigation/types';
import { userService } from '@/services/user.service';
import { uploadService } from '@/services/upload.service';
import { useAlert, Alert as AlertComponent } from '@/components/alert';
import * as ImagePicker from 'expo-image-picker';
import { specialityService } from '@/services/speciality.service';
import DateTimePicker from '@react-native-community/datetimepicker';


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
  const setUser = useAuthStore((state) => state.setUser);

  // Basic Information
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState(user?.gender || '');

  // Professional Information (Consultant)
  const [about, setAbout] = useState(user?.about || '');
  const [languages, setLanguages] = useState(user?.languages || []);
  const [speciality, setSpeciality] = useState(user?.speciality || '');
  const [certification, setCertification] = useState(user?.certification || '');
  const [yrsOfExperience, setYrsOfExperience] = useState(user?.yrsOfExperience?.toString() || 0);
  const [workingHours, setWorkingHours] = useState(user?.workingHours);
  const [showWorkingHoursEditor, setShowWorkingHoursEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();
  const [specialities, setSpecialities] = useState([]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDateOfBirth(formattedDate);
    }
  };



  // console.log(fullName,
  //   email,
  //   phone,
  //   address,
  //   dateOfBirth,
  //   gender,
  //   about,
  //   languages,
  //   speciality,
  //   certification,
  //   yrsOfExperience,
  //   workingHours,)
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const data = {
        fullName,
        email,
        phone,
        address,
        dateOfBirth,
        gender,
        about,
        languages: languages as string[],
        speciality,
        certification: certification as string[],
        yrsOfExperience: Number(yrsOfExperience),
        workingHours,
      };

      const reponse = await userService.updateProfile(data);
      // console.log(reponse)

      setUser({ ...user, ...reponse.data })
      showSuccess('Profile updated successfully', 'Success');
      setIsLoading(false);
      navigation.goBack();
    } catch (error: any) {
      console.log(error)
      showError(`${error.message || error}`, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // 1. Pick Image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        const asset = result.assets[0];

        // 2. Prepare FormData
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
          uri: asset.uri,
          name: filename,
          type,
        } as any);

        // 3. Upload File
        const uploadResponse = await uploadService.uploadFile(formData);

        // Assuming uploadResponse.data contains the secure_url based on standard axios usage in this project
        // Or if uploadService extracts data, adjust accordingly. 
        // User said it returns { secure_url: 'url', public_id: 'public' }
        const secureUrl = uploadResponse.data?.secure_url || uploadResponse.secure_url;

        if (!secureUrl) {
          throw new Error('Failed to get secure URL from upload');
        }

        // 4. Update Profile Picture
        await userService.updateProfilePicture({ dp: secureUrl });

        // 5. Update Local State
        if (user) {
          setUser({ ...user, avatar: secureUrl });
        }

        showSuccess('Profile picture updated successfully', 'Success');
      }
    } catch (error: any) {
      console.log('Image upload error:', error);
      showError(error.message || 'Failed to update profile picture', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

    const getSpecialities = async () => {
      try {
        const response = await specialityService.getSpecialities();
        const specs = response.data;
        setSpecialities(specs);

        // If current speciality is a name, try to find matching ID
        if (speciality && !specs.find((s: any) => s.id === speciality)) {
          const match = specs.find((s: any) => s.name === speciality);
          if (match) {
            setSpeciality(match.id);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    getSpecialities();
  }, [])

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
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
              onPress={handleImagePick}
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

            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <Input
                  label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  value={dateOfBirth}
                  onChangeText={() => {}}
                  leftIcon="calendar-outline"
                  editable={false}
                />
              </View>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

            <Input
              label="Gender"
              placeholder="Male/Female/Other"
              value={gender}
              onChangeText={setGender}
              leftIcon="male-female-outline"
            />

            <Pressable
              style={[styles.workingHoursButton, { backgroundColor: theme.colors.surface.secondary }]}
              onPress={() => setShowWorkingHoursEditor(true)}
            >
              <View style={styles.workingHoursContent}>
                <View style={styles.workingHoursLeft}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.text.secondary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.workingHoursLabel, { color: theme.colors.text.secondary }]}>
                      Working Hours
                    </Text>
                    {workingHours && Object.keys(workingHours).length > 0 ? (
                      <Text style={[styles.workingHoursValue, { color: theme.colors.text.primary }]}>
                        {Object.keys(workingHours).length} days set
                      </Text>
                    ) : (
                      <Text style={[styles.workingHoursPlaceholder, { color: theme.colors.text.tertiary }]}>
                        Not set
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </View>
            </Pressable>
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

                <Dropdown
                  label="Specialization"
                  placeholder="Select Specialization"
                  data={specialities?.map((s: any) => ({ label: s.name, value: s.id })) || []}
                  value={speciality}
                  onSelect={(item) => setSpeciality(item.value)}
                  leftIcon="medical-outline"
                />


                <Input
                  label="Certification"
                  placeholder="Your certifications"
                  value={Array.isArray(certification) ? certification.join(', ') : certification}
                  onChangeText={(value) => setCertification(value.split(',').map((cert) => cert.trim()))}
                  leftIcon="school-outline"
                />
                <Input
                  label="Languages"
                  placeholder="Your languages"
                  value={Array.isArray(languages) ? languages.join(', ') : languages}
                  onChangeText={(value) => setLanguages(value.split(',').map((lang) => lang.trim()))}
                  leftIcon="language-outline"
                />

                <Input
                  label="Years of Experience"
                  placeholder="Enter years"
                  value={String(yrsOfExperience)}
                  onChangeText={setYrsOfExperience}
                  keyboardType="numeric"
                  leftIcon="time-outline"
                />


              </View>

              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={isLoading}
                fullWidth
              />
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomAction, { backgroundColor: theme.colors.background.primary }]}>

        </View>
        <AlertComponent
          type={alert.type}
          message={alert.message}
          title={alert.title}
          visible={alert.visible}
          onClose={hideAlert}
        />
      </KeyboardAvoidingView>
      <WorkingHoursEditor
        visible={showWorkingHoursEditor}
        workingHours={workingHours || {}}
        onClose={() => setShowWorkingHoursEditor(false)}
        onSave={(hours) => {
          setWorkingHours(hours);
          setShowWorkingHoursEditor(false);
        }}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  workingHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  workingHoursContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workingHoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workingHoursLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  workingHoursValue: {
    fontSize: 16,
  },
  workingHoursPlaceholder: {
    fontSize: 14,
  },
});