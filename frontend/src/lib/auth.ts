import Cookies from 'js-cookie';
import { apiClient } from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface LoginCredentialsWithRememberMe extends LoginCredentials {
  rememberMe?: boolean;
}

// Enhanced token management with cookie support
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    // Try cookies first (for HTTP-only cookies, this won't work, but for fallback)
    const cookieToken = Cookies.get('accessToken');
    if (cookieToken) {
      console.log('Token found in cookies');
      return cookieToken;
    }
    // Fallback to localStorage
    const localToken = localStorage.getItem('token');
    if (localToken) {
      console.log('Token found in localStorage');
      return localToken;
    }
    console.log('No token found');
    return null;
  },

  setToken: (token: string, rememberMe: boolean = false): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    // Set cookie for cross-tab synchronization (not HTTP-only for client access)
    const expires = rememberMe ? 30 : 1; // 30 days or 1 day
    Cookies.set('accessToken', token, { expires, secure: true, sameSite: 'strict' });
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    const cookieToken = Cookies.get('refreshToken');
    if (cookieToken) return cookieToken;
    return localStorage.getItem('refreshToken');
  },

  setRefreshToken: (token: string, rememberMe: boolean = false): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
    const expires = rememberMe ? 30 : 7; // 30 days or 7 days
    Cookies.set('refreshToken', token, { expires, secure: true, sameSite: 'strict' });
  },

  getRememberMe: (): boolean => {
    if (typeof window === 'undefined') return false;
    const rememberMe = Cookies.get('rememberMe');
    return rememberMe === 'true';
  },

  setRememberMe: (rememberMe: boolean): void => {
    if (typeof window === 'undefined') return;
    const expires = rememberMe ? 30 : 1;
    Cookies.set('rememberMe', rememberMe.toString(), { expires, secure: true, sameSite: 'strict' });
  },

  removeTokens: (): void => {
    if (typeof window === 'undefined') return;
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Remove from cookies
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('rememberMe');
  },

  setTokens: (accessToken: string, refreshToken: string, rememberMe: boolean = false): void => {
    tokenManager.setToken(accessToken, rememberMe);
    tokenManager.setRefreshToken(refreshToken, rememberMe);
    tokenManager.setRememberMe(rememberMe);
  }
};

// User management
export const userManager = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  }
};

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (data: RegisterData & { rememberMe?: boolean }): Promise<AuthResponse> => {
    const { rememberMe = false, ...registerData } = data;
    console.log('AuthAPI: Starting registration for:', registerData.email);

    const response = await apiClient.post<AuthResponse>('/auth/register', { ...registerData, rememberMe });

    if (response.success && response.data) {
      const { user, accessToken, refreshToken } = response.data;
      console.log('AuthAPI: Registration successful, storing tokens and user data');
      tokenManager.setTokens(accessToken, refreshToken, rememberMe);
      userManager.setUser(user);
      return response.data;
    }

    console.error('AuthAPI: Registration failed:', response.message);
    throw new Error(response.message || 'Registration failed');
  },

  // Login user with remember me support
  login: async (credentials: LoginCredentialsWithRememberMe): Promise<AuthResponse> => {
    const { rememberMe = false, ...loginData } = credentials;
    console.log('AuthAPI: Starting login for:', loginData.email);

    const response = await apiClient.post<AuthResponse>('/auth/login', { ...loginData, rememberMe });

    if (response.success && response.data) {
      const { user, accessToken, refreshToken } = response.data;
      console.log('AuthAPI: Login successful, storing tokens and user data');
      tokenManager.setTokens(accessToken, refreshToken, rememberMe);
      userManager.setUser(user);
      console.log('AuthAPI: Tokens and user data stored successfully');
      return response.data;
    }

    console.error('AuthAPI: Login failed:', response.message);
    throw new Error(response.message || 'Login failed');
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      tokenManager.removeTokens();
      userManager.removeUser();
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken
    });

    if (response.success && response.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      tokenManager.setTokens(accessToken, newRefreshToken);
      return response.data;
    }

    throw new Error(response.message || 'Token refresh failed');
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    
    if (response.success && response.data) {
      userManager.setUser(response.data.user);
      return response.data.user;
    }
    
    throw new Error(response.message || 'Failed to get profile');
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<{ user: User }>('/auth/profile', data);
    
    if (response.success && response.data) {
      userManager.setUser(response.data.user);
      return response.data.user;
    }
    
    throw new Error(response.message || 'Failed to update profile');
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }
};

// Auth utilities
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken() && !!userManager.getUser();
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const user = userManager.getUser();
    return user?.role === 'admin';
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return userManager.getUser();
  },

  // Check if token is expired (basic check)
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  // Auto refresh token if needed
  autoRefreshToken: async (): Promise<boolean> => {
    const token = tokenManager.getToken();
    const refreshToken = tokenManager.getRefreshToken();

    if (!token || !refreshToken) {
      return false;
    }

    // Check if token is expired or will expire in next 5 minutes
    if (authUtils.isTokenExpired(token)) {
      try {
        await authAPI.refreshToken();
        return true;
      } catch (error) {
        console.error('Auto refresh failed:', error);
        authAPI.logout();
        return false;
      }
    }

    return true;
  },

  // Initialize auth state from storage
  initializeAuth: (): User | null => {
    console.log('AuthUtils: Initializing auth from storage...');
    const token = tokenManager.getToken();
    const user = userManager.getUser();

    console.log('AuthUtils: Token exists:', !!token);
    console.log('AuthUtils: User exists:', !!user);

    if (token && user && !authUtils.isTokenExpired(token)) {
      console.log('AuthUtils: Valid auth data found, user:', user.name);
      return user;
    }

    console.log('AuthUtils: Invalid or missing auth data, clearing storage');
    // Clear invalid auth data
    tokenManager.removeTokens();
    userManager.removeUser();
    return null;
  }
};

// Export everything
export default {
  tokenManager,
  userManager,
  authAPI,
  authUtils
};
