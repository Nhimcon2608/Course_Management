'use client';

import React, { useEffect, useState } from 'react';
import { useAuthActions, useAuth } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initializeAuth, checkAuth } = useAuthActions();
  const { isAuthenticated } = useAuth();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only initialize auth on client side after hydration
    if (!isClient) return;

    const initAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...');
        initializeAuth();

        // Small delay to let state settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check auth status to ensure tokens are valid
        console.log('AuthProvider: Checking auth status...');
        await checkAuth();
      } catch (error) {
        console.error('AuthProvider: Auth initialization failed:', error);
        // Ensure loading state is cleared even on error
        initializeAuth();
      } finally {
        console.log('AuthProvider: Auth initialization complete');
        setAuthInitialized(true);
      }
    };

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('AuthProvider: Timeout reached, forcing initialization complete');
      setAuthInitialized(true);
      initializeAuth(); // Clear loading state
    }, 3000); // 3 second timeout

    initAuth().finally(() => {
      clearTimeout(timeout);
    });

    return () => clearTimeout(timeout);
  }, [initializeAuth, checkAuth, isClient]);

  useEffect(() => {
    // Set up periodic token refresh only if authenticated and on client
    if (!isClient || !isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Periodic auth check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Cleanup interval on unmount or when auth state changes
    return () => clearInterval(refreshInterval);
  }, [checkAuth, isAuthenticated, isClient]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage' || e.key === 'token' || e.key === 'user') {
        // Re-initialize auth when storage changes in another tab
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth, isClient]);

  return <>{children}</>;
};

export default AuthProvider;
