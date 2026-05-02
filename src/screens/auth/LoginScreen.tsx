/**
 * Jiggy Care Mobile - Login Screen
 * Premium login with email/password and Google Sign-In
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
  Image,
} from 'react-native';
import { useAlert, Alert } from '@/components/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { useAuthStore } from '../../stores';
import { Button, Input } from '../../components';
import { authService } from '../../services/auth.service';
import { useGoogleAuth } from './UseGoogleAuth';
import { loginOneSignalUser } from '@/services/oneSignal.service';



type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;


interface Props {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: Props) {
  const theme = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();
const {setUser} = useAuthStore()
const { signIn } = useGoogleAuth();


  const validateForm = (): boolean => {
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await authService.login(email, password);

      if(!email || !password){
        showError('Email and password are required', 'Error');
        return;
      }
      showSuccess('Login successful', 'Success');
      console.log('Login successful:', response);
      // Update global state which triggers navigation to Main
      // We fill in missing fields with placeholders + current date

      
      setUser({
        id: response.data.id,
        email: response.data.email,
        fullName: response.data.fullName,
        avatar: response.data.dp,
        role: response.data.role,
        phone: response.data.phone,
        emailVerified: response.data.emailVerified,
        dateJoined: response.data.dateJoined,
        address: response.data.address,
        dateOfBirth: response.data.dateOfBirth,
        gender: response.data.gender,
        about: response.data.about,
        availability: response.data.availability,
        certification: response.data.certification,
        speciality: response.data.speciality,
        prefix: response.data.specialityPrefix,
        workingHours: response.data.workingHours,
        yrsOfExperience: response.data.yrsOfExperience,
        languages: response.data.languages,
      });

      loginOneSignalUser(response.data.id)
      
    } catch (error: any) {
      showError(`Error: ${error.message || error}`, 'Error')
      console.log(error)
      setLoading(false)
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)

      const idToken = await signIn(); // from useGoogleAuth

      if (!idToken) throw new Error('No ID token');

      // Send token to backend
      const response = await authService.googleLogin(idToken);
      console.log('response', response)
      setUser({
        id: response.data.id,
        email: response.data.email,
        fullName: response.data.fullName,
        avatar: response.data.dp,
        role: response.data.role,
        phone: response.data.phone,
        emailVerified: response.data.emailVerified,
        dateJoined: response.data.dateJoined,
        address: response.data.address,
        dateOfBirth: response.data.dateOfBirth,
        gender: response.data.gender,
        about: response.data.about,
        availability: response.data.availability,
        certification: response.data.certification,
        speciality: response.data.speciality,
        prefix: response.data.specialityPrefix,
        workingHours: response.data.workingHours,
        yrsOfExperience: response.data.yrsOfExperience,
        languages: response.data.languages,
      });

      const oneSignal = loginOneSignalUser(response.data.id)
      console.log("onesignal",oneSignal)

      setLoading(false)
      showSuccess('Login successful', 'Success');

    } catch (error: any) {
      showError(`Error: ${error.message || error}`, 'Error')
      console.log(error)
      setLoading(false)    }
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

            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.bold }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular }]}>
              Sign in to your consultant account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.palette.error[50] }]}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.palette.error[500]} />
                <Text style={[styles.errorText, { color: theme.colors.palette.error[600] }]}>
                  {error}
                </Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              leftIcon="lock-closed-outline"
              isPassword
            />

            <Pressable style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.accent }]}>
                Forgot Password?
              </Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.primary }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.tertiary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.primary }]} />
            </View>

            {/* Google Sign In */}
            <Pressable
              style={[styles.googleButton, { borderColor: theme.colors.border.primary }]}
              onPress={handleGoogleSignIn}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleButtonText, { color: theme.colors.text.primary }]}>
                Continue with Google
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={[styles.signupLink, { color: theme.colors.accent }]}>
                Sign Up
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
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 30,
  },
});
