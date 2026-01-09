import AsyncStorage from '@react-native-async-storage/async-storage';
import axios,  { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Base API URL
const BASE_URL = 'https://jiggy-care.onrender.com/api/v1';

// Storage keys
const ACCESS_TOKEN_KEY = 'x-access-token';
const REFRESH_TOKEN_KEY = 'x-refresh-token';

// Create axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'mobile', // ✅ Added to every request
    },
});

// Token management functions
export const tokenManager = {
    getAccessToken: async (): Promise<string | null> => {
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken: async (): Promise<string | null> => {
        return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },

    clearTokens: async (): Promise<void> => {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};

// Flag to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor - Add access token to every request
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const accessToken = await tokenManager.getAccessToken();

        if (accessToken && config.headers) {
            config.headers['x-access-token'] = accessToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Check if response contains new tokens and save them
        const accessToken = response.headers['x-access-token'];
        const refreshToken = response.headers['x-refresh-token'];

        if (accessToken && refreshToken) {
            tokenManager.setTokens(accessToken, refreshToken);
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is not 401 or request is already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If already refreshing, queue the request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers['x-access-token'] = token;
                    return apiClient(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = await tokenManager.getRefreshToken();

        if (!refreshToken) {
            // No refresh token, logout user
            await tokenManager.clearTokens();
            processQueue(new Error('No refresh token available'), null);
            isRefreshing = false;
            return Promise.reject(error);
        }

        try {
            // Call refresh endpoint
            const response = await axios.post(
                `${BASE_URL}/auth/refresh`,
                {},
                {
                    headers: {
                        'x-client-type': 'mobile',
                        'x-refresh-token': refreshToken,
                    },
                }
            );

            // Get new tokens from response headers
            const newAccessToken = response.headers['x-access-token'];
            const newRefreshToken = response.headers['x-refresh-token'];

            if (newAccessToken && newRefreshToken) {
                // Save new tokens
                await tokenManager.setTokens(newAccessToken, newRefreshToken);

                // Update original request with new token
                originalRequest.headers['x-access-token'] = newAccessToken;

                // Process queued requests
                processQueue(null, newAccessToken);

                isRefreshing = false;

                // Retry original request
                return apiClient(originalRequest);
            } else {
                throw new Error('No tokens in refresh response');
            }
        } catch (refreshError) {
            // Refresh failed, logout user
            processQueue(refreshError, null);
            await tokenManager.clearTokens();
            isRefreshing = false;
            return Promise.reject(refreshError);
        }
    }
);

// Generic API call function
export const apiRequest = async <T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await apiClient.request({
            method,
            url,
            data,
            ...config,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message || 'An error occurred';
    }
};

// Convenience methods
export const api = {
    get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        apiRequest<T>('GET', url, undefined, config),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiRequest<T>('POST', url, data, config),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiRequest<T>('PUT', url, data, config),

    delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
        apiRequest<T>('DELETE', url, undefined, config),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiRequest<T>('PATCH', url, data, config),
};

export default api;