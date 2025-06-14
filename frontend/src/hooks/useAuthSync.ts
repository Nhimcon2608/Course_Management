'use client';

import { useEffect } from 'react';
import { useAuthActions, useAuth } from '@/store/authStore';
import { tokenManager, userManager } from '@/lib/auth';

/**
 * Hook to synchronize authentication state across components
 * Ensures that auth state is properly updated when tokens/user data changes
 */
export const useAuthSync = () => {
  const { initializeAuth, checkAuth } = useAuthActions();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if we have tokens but no auth state
    const token = tokenManager.getToken();
    const storedUser = userManager.getUser();
    
    if (token && storedUser && !isAuthenticated) {
      console.log('Auth sync: Found tokens but not authenticated, initializing...');
      initializeAuth();
    }
  }, [isAuthenticated, initializeAuth]);

  useEffect(() => {
    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'auth-storage') {
        console.log('Auth sync: Storage changed, re-initializing auth...');
        initializeAuth();
      }
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      console.log('Auth sync: Auth change event detected, checking auth...');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [initializeAuth, checkAuth]);

  return { isAuthenticated, user };
};

/**
 * Trigger auth change event to notify all components
 */
export const triggerAuthChange = () => {
  window.dispatchEvent(new CustomEvent('auth-change'));
};
