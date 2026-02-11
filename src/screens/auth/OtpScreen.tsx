/**
 * Jiggy Care Mobile - OTP Verification Screen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme';
import { Button } from '../../components';
import { Alert, useAlert } from '@/components/alert';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { loginOneSignalUser } from '@/services/oneSignal.service';

type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<
    AuthStackParamList,
    'OTPVerification'
>;

interface Props {
    navigation: OTPVerificationScreenNavigationProp;
    route: {
        params: {
            email: string;
            phone?: string;
        };
    };
}

export function OTPVerificationScreen({ navigation, route }: Props) {
    const theme = useAppTheme();
    const { alert, showSuccess, showError, hideAlert } = useAlert();
const {setUser} = useAuthStore()
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const {userSignupData} = useAuthStore()
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const { email, phone } = route.params;

    // Timer for resend OTP
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                handleVerifyOtp(fullOtp);
            }
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        // Handle backspace
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    if(!userSignupData){
        navigation.navigate('Login');
        return
    }

    const handleVerifyOtp = async (otpCode?: string) => {
        const code = otpCode || otp.join('');

        if (code.length !== 6) {
            showError('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);

        try {
            // console.log(String(code), otp)
            const response = await authService.signup(userSignupData.fullName, userSignupData.email, userSignupData.password, String(code));
            showSuccess('Verification successful!', 'Success');
            // console.log(response.data)
            setUser(response.data);

            loginOneSignalUser(response.data.id)
           
        } catch (error: any) {
            showError(
                error.message || 'Invalid OTP. Please try again.',
                'Verification Failed'
            );
            // Clear OTP fields on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        try {
            await authService.sendOtp(userSignupData.fullName,userSignupData.email);
            showSuccess('OTP sent successfully!');
            setResendTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            showError(error.message || 'Failed to resend OTP', 'Error');
        }
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={[
                            styles.backButton,
                            { backgroundColor: theme.colors.surface.secondary },
                        ]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={theme.colors.text.primary}
                        />
                    </Pressable>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: theme.colors.surface.secondary },
                        ]}
                    >
                        <Ionicons
                            name="mail-outline"
                            size={48}
                            color={theme.colors.accent}
                        />
                    </View>

                    <Text
                        style={[
                            styles.title,
                            {
                                color: theme.colors.text.primary,
                                fontFamily: theme.fontFamily.bold,
                            },
                        ]}
                    >
                        Verify Your Email
                    </Text>

                    <Text
                        style={[
                            styles.subtitle,
                            {
                                color: theme.colors.text.secondary,
                                fontFamily: theme.fontFamily.regular,
                            },
                        ]}
                    >
                        We've sent a 6-digit code to
                    </Text>

                    <Text
                        style={[
                            styles.email,
                            {
                                color: theme.colors.accent,
                                fontFamily: theme.fontFamily.semiBold,
                            },
                        ]}
                    >
                        {email}
                    </Text>

                    {/* OTP Input Fields */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    {
                                        backgroundColor: theme.colors.surface.secondary,
                                        color: theme.colors.text.primary,
                                        borderColor: digit
                                            ? theme.colors.accent
                                            : theme.colors.border.primary,
                                    },
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={({ nativeEvent }) =>
                                    handleKeyPress(nativeEvent.key, index)
                                }
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!isLoading}
                            />
                        ))}
                    </View>

                    {/* Resend Section */}
                    <View style={styles.resendContainer}>
                        <Text
                            style={[
                                styles.resendText,
                                { color: theme.colors.text.secondary },
                            ]}
                        >
                            Didn't receive the code?{' '}
                        </Text>
                        {canResend ? (
                            <Pressable onPress={handleResendOtp}>
                                <Text
                                    style={[
                                        styles.resendLink,
                                        { color: theme.colors.accent },
                                    ]}
                                >
                                    Resend
                                </Text>
                            </Pressable>
                        ) : (
                            <Text
                                style={[
                                    styles.resendTimer,
                                    { color: theme.colors.text.tertiary },
                                ]}
                            >
                                Resend in {resendTimer}s
                            </Text>
                        )}
                    </View>

                    {/* Verify Button */}
                    <Button
                        title="Verify OTP"
                        onPress={() => handleVerifyOtp()}
                        loading={isLoading}
                        fullWidth
                        style={styles.verifyButton}
                    />

                    {/* Change Email */}
                    <Pressable onPress={() => navigation.goBack()}>
                        <Text
                            style={[
                                styles.changeEmail,
                                { color: theme.colors.text.secondary },
                            ]}
                        >
                            Wrong email? <Text style={{ color: theme.colors.accent }}>Change it</Text>
                        </Text>
                    </Pressable>
                </View>

                {/* Alert */}
                <Alert
                    type={alert.type}
                    message={alert.message}
                    title={alert.title}
                    visible={alert.visible}
                    onClose={hideAlert}
                />
            </KeyboardAvoidingView>
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    otpInput: {
        width: 50,
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    resendText: {
        fontSize: 14,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    resendTimer: {
        fontSize: 14,
    },
    verifyButton: {
        marginBottom: 16,
    },
    changeEmail: {
        fontSize: 14,
        textAlign: 'center',
    },
});