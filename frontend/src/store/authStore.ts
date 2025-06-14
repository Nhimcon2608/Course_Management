import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData } from '@/types';
import { authAPI, authUtils, tokenManager, userManager } from '@/lib/auth';

interface LoginCredentialsWithRememberMe extends LoginCredentials {
  rememberMe?: boolean;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentialsWithRememberMe) => Promise<void>;
  register: (data: RegisterData & { rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login action with remember me support
        login: async (credentials: LoginCredentialsWithRememberMe) => {
          set({ isLoading: true, error: null });

          try {
            console.log('Auth Store: Starting login for:', credentials.email);
            const authResponse = await authAPI.login(credentials);

            console.log('Auth Store: Login successful, updating state');
            set({
              user: authResponse.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // Trigger auth change event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth-change'));
            }

            console.log('Auth Store: Login state updated successfully');
            return authResponse; // Return the response so components can access user data
          } catch (error: any) {
            console.error('Auth Store: Login failed:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Login failed'
            });
            throw error;
          }
        },

        // Register action with remember me support
        register: async (data: RegisterData & { rememberMe?: boolean }) => {
          set({ isLoading: true, error: null });

          try {
            console.log('Auth Store: Starting registration for:', data.email);
            const authResponse = await authAPI.register(data);

            console.log('Auth Store: Registration successful, setting user state');
            set({
              user: authResponse.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // Trigger auth change event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth-change'));
            }

            console.log('Auth Store: Registration complete');
            return authResponse; // Return the response so components can access user data
          } catch (error) {
            console.error('Auth Store: Registration failed:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Registration failed'
            });
            throw error;
          }
        },

        // Logout action
        logout: async () => {
          set({ isLoading: true });
          
          try {
            await authAPI.logout();
          } catch (error) {
            console.warn('Logout API call failed:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });

            // Trigger auth change event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth-change'));
            }
          }
        },

        // Refresh token action
        refreshToken: async () => {
          try {
            await authAPI.refreshToken();
            // Token is updated in authAPI, no need to update state
          } catch (error) {
            // If refresh fails, logout user
            get().logout();
            throw error;
          }
        },

        // Get profile action
        getProfile: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const user = await authAPI.getProfile();
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to get profile'
            });
            throw error;
          }
        },

        // Update profile action
        updateProfile: async (data: Partial<User>) => {
          set({ isLoading: true, error: null });
          
          try {
            const updatedUser = await authAPI.updateProfile(data);
            
            set({
              user: updatedUser,
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to update profile'
            });
            throw error;
          }
        },

        // Change password action
        changePassword: async (currentPassword: string, newPassword: string) => {
          set({ isLoading: true, error: null });
          
          try {
            await authAPI.changePassword(currentPassword, newPassword);
            
            set({
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to change password'
            });
            throw error;
          }
        },

        // Clear error action
        clearError: () => {
          set({ error: null });
        },

        // Initialize auth from storage
        initializeAuth: () => {
          if (typeof window === 'undefined') return;

          const user = authUtils.initializeAuth();

          console.log('Auth Store: Initializing auth, user found:', !!user);

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null
          });
        },

        // Check authentication status
        checkAuth: async (): Promise<boolean> => {
          const token = tokenManager.getToken();
          const user = userManager.getUser();

          if (!token || !user) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            return false;
          }

          // Check if token is expired
          if (authUtils.isTokenExpired(token)) {
            try {
              await get().refreshToken();
              return true;
            } catch (error) {
              await get().logout();
              return false;
            }
          }

          // Verify token with server by making a profile request
          try {
            const profileUser = await authAPI.getProfile();
            set({
              user: profileUser,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } catch (error) {
            // Token is invalid, logout
            await get().logout();
            return false;
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
        // Skip hydration on server to prevent mismatch
        skipHydration: typeof window === 'undefined',
        // Custom hydration to handle SSR properly
        onRehydrateStorage: () => (state) => {
          console.log('Zustand: Rehydrating auth state', state);
          if (state && typeof window !== 'undefined') {
            // Small delay to ensure everything is loaded
            setTimeout(() => {
              console.log('Zustand: Re-initializing auth after hydration');
              state.initializeAuth();
            }, 100);
          }
        }
      }
    )
  )
);

// Selectors for easier access - using direct subscriptions
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin: user?.role === 'admin'
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshToken: store.refreshToken,
    getProfile: store.getProfile,
    updateProfile: store.updateProfile,
    changePassword: store.changePassword,
    clearError: store.clearError,
    initializeAuth: store.initializeAuth,
    checkAuth: store.checkAuth
  };
};
