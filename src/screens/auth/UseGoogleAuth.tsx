import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';

export const useGoogleAuth = () => {
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            // offlineAccess: true,
            // forceCodeForRefreshToken: true,
        });
    }, []);

    const signIn = async () => {
        try {
            await GoogleSignin.signOut();

            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            if(response.data){
                return response.data.idToken;
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    return { signIn };
};