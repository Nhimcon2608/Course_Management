'use client';

import { useEffect, useState } from 'react';
import { useAuthActions, useAuth } from '@/store/authStore';
import { tokenManager, userManager } from '@/lib/auth';

/**
 * Hook to handle proper authentication initialization
 * This ensures auth state is correctly loaded from storage and validated
 */
export const useAuthInitialization = () => {
  const { initializeAuth, checkAuth } = useAuthActions();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const initializeAuthentication = async () => {
      if (initializationAttempted) return;
      
      console.log('🔐 Starting authentication initialization...');
      setInitializationAttempted(true);

      try {
        // Step 1: Check if we have stored auth data
        const token = tokenManager.getToken();
        const storedUser = userManager.getUser();
        
        console.log('🔍 Checking stored auth data:', {
          hasToken: !!token,
          hasUser: !!storedUser,
          userName: storedUser?.name
        });

        if (token && storedUser) {
          console.log('✅ Found stored auth data, initializing...');
          
          // Initialize auth state from storage
          initializeAuth();
          
          // Wait a bit for state to update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify the token is still valid by checking with server
          try {
            console.log('🔄 Validating token with server...');
            await checkAuth();
            console.log('✅ Token validation successful');
          } catch (error) {
            console.log('❌ Token validation failed, clearing auth data');
            tokenManager.removeTokens();
            userManager.removeUser();
            initializeAuth(); // Clear the state
          }
        } else {
          console.log('ℹ️ No stored auth data found');
          initializeAuth(); // Ensure clean state
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Ensure clean state on error
        tokenManager.removeTokens();
        userManager.removeUser();
        initializeAuth();
      } finally {
        setIsInitialized(true);
        console.log('🏁 Authentication initialization complete');
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(initializeAuthentication, 100);
      return () => clearTimeout(timer);
    }
  }, [initializeAuth, checkAuth, initializationAttempted]);

  return {
    isInitialized,
    isAuthenticated,
    user,
    isLoading: isLoading || !isInitialized
  };
};
