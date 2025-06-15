'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { VerifyEmailResponse } from '@/types';

// Global protection against double verification
const VERIFICATION_STORAGE_KEY = 'email_verification_in_progress';
const VERIFICATION_COMPLETED_KEY = 'email_verification_completed';

const isVerificationInProgress = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  const inProgress = sessionStorage.getItem(`${VERIFICATION_STORAGE_KEY}_${token}`);
  return inProgress === 'true';
};

const markVerificationInProgress = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${VERIFICATION_STORAGE_KEY}_${token}`, 'true');
};

const clearVerificationInProgress = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${VERIFICATION_STORAGE_KEY}_${token}`);
};

const isVerificationCompleted = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  const completed = sessionStorage.getItem(`${VERIFICATION_COMPLETED_KEY}_${token}`);
  return completed === 'true';
};

const markVerificationCompleted = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${VERIFICATION_COMPLETED_KEY}_${token}`, 'true');
};

// Clear all verification cache
const clearAllVerificationCache = (): void => {
  if (typeof window === 'undefined') return;

  // Clear all verification-related items from sessionStorage
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.includes('email_verification_')) {
      sessionStorage.removeItem(key);
      console.log(`🧹 Cleared cache: ${key}`);
    }
  });

  console.log('🧹 All verification cache cleared');
};

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // ← Thêm state protection
  const hasExecuted = useRef(false); // ← Thêm ref protection

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { updateProfile } = useAuthStore();

  const token = searchParams?.get('token');

  // Memoized verification function
  const executeVerification = useCallback(async (verificationToken: string) => {
    console.log(`🔍 Starting verification for token: ${verificationToken.substring(0, 10)}...`);

    // Global protection check
    if (isVerificationInProgress(verificationToken)) {
      console.log('🚫 GLOBAL PROTECTION: Verification already in progress for this token');
      return;
    }

    if (isVerificationCompleted(verificationToken)) {
      console.log('🚫 GLOBAL PROTECTION: Verification already completed for this token');
      setIsSuccess(true);
      setIsLoading(false);
      return;
    }

    // Component-level protection
    if (isVerifying || hasExecuted.current) {
      console.log('🚫 COMPONENT PROTECTION: Verification already in progress');
      return;
    }

    // Mark as in progress globally and locally
    markVerificationInProgress(verificationToken);
    hasExecuted.current = true;
    setIsVerifying(true);

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Mark as completed globally
        markVerificationCompleted(verificationToken);

        setIsSuccess(true);
        toast.success(data.message || 'Email verified successfully!');

        // Update user in auth store if verification data is returned
        if (data.data?.user) {
          try {
            await updateProfile(data.data.user);
            console.log('✅ User profile updated successfully');
          } catch (updateError) {
            console.warn('⚠️ Failed to update user profile:', updateError);
            // Don't fail the verification if profile update fails
          }
        }

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Failed to verify email');
        toast.error(data.message || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while verifying your email';
      console.error('Full error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Clear global progress flag
      clearVerificationInProgress(verificationToken);
      setIsLoading(false);
      setIsVerifying(false);
    }
  }, [router, updateProfile]);

  useEffect(() => {
    console.log(`🔍 Raw URL: ${window.location.href}`);
    console.log(`🔍 Search params: ${window.location.search}`);
    console.log(`🔍 Token from searchParams: ${token}`);
    console.log(`🔍 Token length: ${token?.length || 0}`);

    // Debug: Check for cached tokens
    if (typeof window !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      const verificationKeys = keys.filter(key => key.includes('email_verification_'));
      console.log(`🔍 Cached verification keys:`, verificationKeys);
      verificationKeys.forEach(key => {
        console.log(`🔍 ${key}: ${sessionStorage.getItem(key)}`);
      });
    }

    if (!token) {
      setError('Verification token is missing');
      setIsLoading(false);
      return;
    }

    // Validate token format (should be 64 hex characters)
    if (token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
      console.error(`❌ Invalid token format: ${token}`);
      setError(`Invalid verification token format. Length: ${token.length}, Expected: 64`);
      setIsLoading(false);
      return;
    }

    // Execute verification with the token
    executeVerification(token);
  }, [token, executeVerification]);



  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('No email address found. Please log in again.');
      return;
    }

    try {
      setIsResending(true);

      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📚 Course Management System
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Email Verification
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verifying your email...
              </h3>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Your email has been verified. You now have full access to all course features.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in 3 seconds...
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verification Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || !user?.email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>

                <button
                  onClick={() => {
                    clearAllVerificationCache();
                    window.location.reload();
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  🧹 Clear Cache & Reload
                </button>

                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
