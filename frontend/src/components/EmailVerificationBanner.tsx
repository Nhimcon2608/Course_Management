'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, X } from 'lucide-react';

interface EmailVerificationBannerProps {
  className?: string;
  showOnVerified?: boolean;
}

export default function EmailVerificationBanner({
  className = '',
  showOnVerified = false
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Don't show banner if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't show banner if user is verified (unless explicitly requested) or dismissed
  if ((user.isEmailVerified && !showOnVerified) || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
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
        toast.success('Verification email sent! Please check your inbox.', {
          icon: '📧',
          duration: 5000
        });
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

  const handleGoToVerification = () => {
    router.push('/auth/verify-email');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Show success banner if verified
  if (user.isEmailVerified && showOnVerified) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Email Verified
              </p>
              <p className="text-sm text-green-700">
                Your email address has been verified. You have full access to all features.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 text-green-400 hover:text-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Please verify your email address to purchase courses and access premium features.
            We've sent a verification link to <strong>{user.email}</strong>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleGoToVerification}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <Mail className="h-3 w-3 mr-1" />
              Check Verification Status
            </button>
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Resend Email
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-4 text-yellow-400 hover:text-yellow-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
