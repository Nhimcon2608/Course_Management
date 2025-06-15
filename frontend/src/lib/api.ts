import axios from 'axios';
import { ApiResponse } from '@/types';

// Create axios instance with cookie support
const api: any = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the base URL for debugging
if (typeof window !== 'undefined') {
  console.log('API Base URL:', api.defaults.baseURL);
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    // Get token from localStorage or cookies (cookies are handled automatically by withCredentials)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiClient = {
  get: <T>(url: string, config?: any): Promise<ApiResponse<T>> =>
    api.get(url, config).then((res: any) => res.data),

  post: <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then((res: any) => res.data),

  put: <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then((res: any) => res.data),

  patch: <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
    api.patch(url, data, config).then((res: any) => res.data),

  delete: <T>(url: string, config?: any): Promise<ApiResponse<T>> =>
    api.delete(url, config).then((res: any) => res.data),
};

export default api;
