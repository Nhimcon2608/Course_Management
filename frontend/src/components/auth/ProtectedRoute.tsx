'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/auth/login',
  fallback = <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
  </div>
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { checkAuth, initializeAuth } = useAuthActions();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Initialize auth from storage first
        initializeAuth();
        
        // Then check if auth is still valid
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [checkAuth, initializeAuth]);

  // Show loading while checking authentication
  if (isChecking || isLoading) {
    return <>{fallback}</>;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    router.push(redirectTo);
    return <>{fallback}</>;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && (!user || user.role !== 'admin')) {
    router.push('/unauthorized');
    return <>{fallback}</>;
  }

  // If authentication is not required and user is authenticated,
  // redirect to dashboard (useful for login/register pages)
  if (!requireAuth && isAuthenticated) {
    const dashboardUrl = user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'instructor'
        ? '/instructor/dashboard'
        : '/dashboard';
    router.push(dashboardUrl);
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
