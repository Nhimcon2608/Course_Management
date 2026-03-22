'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Shield,
  Info
} from 'lucide-react';

interface EmailVerificationSectionProps {
  className?: string;
}

interface RateLimitInfo {
  remaining: number;
  resetTime?: number;
}

const EmailVerificationSection: React.FC<EmailVerificationSectionProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({ remaining: 3 });
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);

  // Update cooldown timer
  useEffect(() => {
    if (cooldownTime && cooldownTime > Date.now()) {
      const timer = setInterval(() => {
        const remaining = cooldownTime - Date.now();
        if (remaining <= 0) {
          setCooldownTime(null);
          setRateLimitInfo({ remaining: 3 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handleResendVerification = async () => {
    if (!user?.email || isResending) return;

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
        
        // Update rate limit info
        const newRemaining = Math.max(0, rateLimitInfo.remaining - 1);
        setRateLimitInfo({ remaining: newRemaining });
        
        if (newRemaining === 0) {
          setCooldownTime(Date.now() + 60 * 60 * 1000); // 1 hour cooldown
        }
      } else {
        // Handle rate limiting
        if (data.error === 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED') {
          const remainingTime = data.remainingTime || 60;
          setCooldownTime(Date.now() + remainingTime * 60 * 1000);
          setRateLimitInfo({ remaining: 0 });
          toast.error(`Too many verification emails sent. Please try again in ${remainingTime} minutes.`);
        } else {
          toast.error(data.message || 'Failed to send verification email');
        }
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const formatCooldownTime = (time: number): string => {
    const remaining = Math.max(0, time - Date.now());
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  const isVerified = user.isEmailVerified;
  const canResend = !isResending && !isVerified && rateLimitInfo.remaining > 0 && !cooldownTime;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Email Verification
        </h2>
      </div>
      
      <div className="p-6">
        {/* Email Address with Status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-medium text-gray-900">{user.email}</span>
              {isVerified ? (
                <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Unverified</span>
                </div>
              )}
            </div>
            
            {/* Verification Status Details */}
            {isVerified ? (
              <div className="text-sm text-gray-600">
                <p className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Your email address has been verified and is secure.
                </p>
                {(user as any).emailVerifiedAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    Verified on {new Date((user as any).emailVerifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Email verification required
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please verify your email address to access all features and ensure account security.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits of Verification */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Why verify your email?
                      </h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Enroll in courses and access learning materials</li>
                        <li>• Receive important course updates and notifications</li>
                        <li>• Secure your account and enable password recovery</li>
                        <li>• Access instructor features (for instructors)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Resend Button and Rate Limiting Info */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleResendVerification}
                    disabled={!canResend}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      canResend
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </button>

                  {/* Rate Limiting Info */}
                  <div className="text-xs text-gray-500">
                    {cooldownTime ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Try again in {formatCooldownTime(cooldownTime)}</span>
                      </div>
                    ) : (
                      <span>{rateLimitInfo.remaining} attempts remaining</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Security Information */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Security Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Verification emails expire after 24 hours</p>
            <p>• Each verification link can only be used once</p>
            <p>• Check your spam folder if you don't receive the email</p>
            <p>• Contact support if you continue having issues</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSection;
