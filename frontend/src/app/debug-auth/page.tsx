'use client';

import { useAuth, useAuthActions } from '@/store/authStore';
import { tokenManager, userManager } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const { initializeAuth, checkAuth } = useAuthActions();
  const [debugInfo, setDebugInfo] = useState<any>({});

  const handleInitializeAuth = () => {
    console.log('Manual auth initialization triggered');
    initializeAuth();
  };

  const handleCheckAuth = async () => {
    console.log('Manual auth check triggered');
    try {
      await checkAuth();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  useEffect(() => {
    const getDebugInfo = () => {
      const token = tokenManager.getToken();
      const refreshToken = tokenManager.getRefreshToken();
      const storedUser = userManager.getUser();
      const rememberMe = tokenManager.getRememberMe();

      setDebugInfo({
        token: token ? `${token.substring(0, 20)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        storedUser: storedUser ? storedUser.name : null,
        rememberMe,
        localStorage: {
          token: localStorage.getItem('token') ? 'exists' : 'missing',
          user: localStorage.getItem('user') ? 'exists' : 'missing',
          refreshToken: localStorage.getItem('refreshToken') ? 'exists' : 'missing',
        },
        cookies: {
          accessToken: document.cookie.includes('accessToken') ? 'exists' : 'missing',
          refreshToken: document.cookie.includes('refreshToken') ? 'exists' : 'missing',
          rememberMe: document.cookie.includes('rememberMe') ? 'exists' : 'missing',
        }
      });
    };

    getDebugInfo();
    const interval = setInterval(getDebugInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Store State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Auth Store State</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Is Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Is Loading:</span>
                <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>
                  {isLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span className="text-gray-800">
                  {user ? user.name : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="text-gray-800">
                  {user ? user.role : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error:</span>
                <span className="text-red-600">
                  {error || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Token Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Token Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Access Token:</span>
                <span className={debugInfo.token ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.token || 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <span className={debugInfo.refreshToken ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.refreshToken || 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stored User:</span>
                <span className={debugInfo.storedUser ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.storedUser || 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remember Me:</span>
                <span className="text-gray-600">
                  {debugInfo.rememberMe ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* LocalStorage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">LocalStorage</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Token:</span>
                <span className={debugInfo.localStorage?.token === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.localStorage?.token || 'missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span className={debugInfo.localStorage?.user === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.localStorage?.user || 'missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <span className={debugInfo.localStorage?.refreshToken === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.localStorage?.refreshToken || 'missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Access Token:</span>
                <span className={debugInfo.cookies?.accessToken === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.cookies?.accessToken || 'missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <span className={debugInfo.cookies?.refreshToken === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.cookies?.refreshToken || 'missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remember Me:</span>
                <span className={debugInfo.cookies?.rememberMe === 'exists' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.cookies?.rememberMe || 'missing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <button
            onClick={handleInitializeAuth}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Initialize Auth
          </button>
          <button
            onClick={handleCheckAuth}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Check Auth
          </button>
          <a href="/auth/login" className="bg-blue-500 text-white px-4 py-2 rounded inline-block">
            Go to Login
          </a>
          <a href="/dashboard" className="bg-green-500 text-white px-4 py-2 rounded inline-block">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
