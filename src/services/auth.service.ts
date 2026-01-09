import api, { tokenManager } from './api.service';

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            email: string;
            role: string;
        };
    };
}

export const authService = {
    // Login
    login: async (email: string, password: string) => {
        try {
            const response = await api.post<any>('/auth/signin', {
                email,
                password,
            });

            // Tokens are automatically saved in the response interceptor
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Logout   
    logout: async (): Promise<void> => {
        await tokenManager.clearTokens();
    },

    signup: async (fullName:string, email: string, password: string, role: string = 'consultant') => {
        try {
            const response = await api.post<any>('/users/signup', {
                fullName, 
                email,
                password,
                role,
            });

            // Tokens are automatically saved in the response interceptor
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        const token = await tokenManager.getAccessToken();
        return !!token;
    },
};