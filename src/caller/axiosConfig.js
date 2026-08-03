import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const getToken = () => {
    // Try localStorage first, then sessionStorage for better persistence
    const accessToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    return accessToken ? accessToken : null;
};


const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const accessToken = getToken();
        if (accessToken) {
            config.headers['Authorization'] = "Bearer " + accessToken;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global auth error handling
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        
        // Handle 401 Unauthorized or 403 Session Expired
        if (status === 401 || (status === 403 && message === 'Session Expired')) {
            // Clear authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
            
            console.log('🔍 Session expired/unauthorized - clearing auth and redirecting to login');
            
            // Redirect to home/login page
            window.location.href = '/';
            
            return Promise.reject({
                ...error,
                isAuthError: true,
                message: 'Session expired. Please login again.'
            });
        }
        return Promise.reject(error);
    }
);
  
export default instance;