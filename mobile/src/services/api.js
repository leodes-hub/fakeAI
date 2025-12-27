import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - change this to your server URL
const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost
// For physical device, use: http://YOUR_COMPUTER_IP:5000/api

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear storage
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Chat API
export const chatAPI = {
    sendMessage: (message) => api.post('/chat/message', { message }),
};

// Q&A API
export const qaAPI = {
    getAll: () => api.get('/qa'),
    create: (data) => api.post('/qa', data),
    update: (id, data) => api.put(`/qa/${id}`, data),
    delete: (id) => api.delete(`/qa/${id}`),
};

// Admin API
export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    activateUser: (id) => api.put(`/admin/users/${id}/activate`),
    deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),
    getStats: () => api.get('/admin/stats'),
};

export default api;
