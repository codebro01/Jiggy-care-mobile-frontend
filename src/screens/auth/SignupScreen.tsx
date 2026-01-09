/**
 * Jiggy Care Mobile - Signup Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { Button, Input } from '../../components';
import { authService } from '@/services/auth.service';
import { Alert, useAlert } from '@/components/alert';
import { useAuthStore } from '@/stores/authStore';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export function SignupScreen({ navigation }: Props) {
  const theme = useAppTheme();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {showError, showSuccess, alert, hideAlert} = useAlert()
const setUserSignupData = useAuthStore((state) => state.setUserSignupData)

   const handleSendOtp = async () => {

   try {
     setIsLoading(true);

     const response = await authService.sendOtp(fullName, email);
     setIsLoading(false);

     setUserSignupData({
       fullName,
       email,
       password,
     })

     navigation.navigate('OTPVerification', { fullName, email });

     console.log(response)
   } catch (error: any) {
     setIsLoading(false);

    console.log(error)
     showError(`Error: ${error.message || error}`, 'Error')

   }


  }

  const handleSignup = async () => {
  try {
      setIsLoading(true);
  
     const response = await authService.sendOtp(fullName, email)

     setUserSignupData({
      fullName,
      email,
      password,
     })

     navigation.navigate('OTPVerification', { fullName, email });
      setIsLoading(false)
      console.log('Signup successful:', response);
  } catch (error: any) {
    showError(`Error: ${error.message}`, 'Error')
    console.log(error)
    setIsLoading(false)

  }

  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={[styles.backButton, { backgroundColor: theme.colors.surface.secondary }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </Pressable>
            
            <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular }]}>
              Join as a healthcare consultant
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              
              <View style={styles.nameInput}>
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>

            <Input
              label="Email"
              placeholder="doctor@example.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              isPassword
              hint="At least 8 characters with numbers"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon="lock-closed-outline"
              isPassword
            />

            <Button
              title="Create Account"
              onPress={handleSendOtp}
              loading={isLoading}
              fullWidth
              style={styles.signupButton}
            />

            <Text style={[styles.terms, { color: theme.colors.text.tertiary }]}>
              By signing up, you agree to our{' '}
              <Text style={{ color: theme.colors.accent }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: theme.colors.accent }}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.colors.accent }]}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Alert
        type={alert.type}
        message={alert.message}
        title={alert.title}
        visible={alert.visible}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
