'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthActions, useAuth, useAuthStore } from '@/store/authStore';
import { LoginCredentials } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ClientOnly from '@/components/ui/ClientOnly';
import { triggerAuthChange } from '@/hooks/useAuthSync';

interface LoginFormData extends LoginCredentials {
  rememberMe: boolean;
}

interface LoginFormProps {
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ redirectTo }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthActions();
  const { isLoading, error, isAuthenticated, user } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  // Auto-focus email field
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Redirect if already authenticated with role-based routing
  useEffect(() => {
    if (isAuthenticated && user) {
      let destination = redirectTo || searchParams.get('redirect');

      // If no specific destination, redirect based on user role
      if (!destination) {
        destination = user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'instructor'
            ? '/instructor/dashboard'
            : '/dashboard';
      }

      console.log('🔄 Already authenticated, redirecting to:', destination);
      router.replace(destination);
    }
  }, [isAuthenticated, user, router, redirectTo, searchParams]);

  // Handle lockout countdown
  useEffect(() => {
    if (lockoutTime && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            setAttemptCount(0);
            return null;
          }
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAttemptCount(prev => prev + 1);

      console.log('🔐 Starting login process...');

      const loginResponse = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      console.log('✅ Login API call successful');

      // Success toast
      toast.success('Welcome back!', {
        icon: '👋',
        duration: 3000
      });

      // Reset attempt count on success
      setAttemptCount(0);

      // Trigger auth change event to notify all components
      triggerAuthChange();

      console.log('🔄 Triggering auth state update...');

      // Determine redirect destination based on user role from login response
      let destination = redirectTo || searchParams.get('redirect');

      // If no specific destination, redirect based on role
      if (!destination) {
        // Get user role from login response (most reliable source)
        const userRole = loginResponse?.user?.role;
        console.log('🔍 Role-based redirect logic:', {
          loginResponse: loginResponse?.user,
          userRole,
          redirectTo,
          searchParamsRedirect: searchParams.get('redirect')
        });

        destination = userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'instructor'
            ? '/instructor/dashboard'
            : '/dashboard';

        console.log('🎯 Final destination determined:', destination);
      }

      console.log('🚀 Redirecting to:', destination);

      // Use router.push for immediate redirect
      router.push(destination);

    } catch (error: any) {
      // Handle different types of errors
      if (error.status === 423) {
        // Account locked
        const lockTime = error.data?.lockTimeRemaining || 120;
        setLockoutTime(lockTime);
        toast.error(`Account locked for ${lockTime} seconds`, {
          icon: '🔒',
          duration: 5000
        });
      } else if (error.status === 429) {
        // Rate limited
        toast.error('Too many attempts. Please wait before trying again.', {
          icon: '⏰',
          duration: 5000
        });
      } else {
        // General error
        const attemptsLeft = error.data?.attemptsRemaining;
        if (attemptsLeft !== undefined) {
          toast.error(`Invalid credentials. ${attemptsLeft} attempts remaining.`, {
            icon: '❌',
            duration: 4000
          });
        } else {
          toast.error(error.message || 'Login failed', {
            icon: '❌',
            duration: 4000
          });
        }
      }

      setError('root', {
        message: error.message || 'Login failed'
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div className="relative">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
            />
            <Mail className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
          </div>

          {/* Password Field */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Error Message */}
          <ClientOnly>
            {(error || errors.root) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-600">
                    {error || errors.root?.message}
                  </p>
                  {attemptCount > 0 && attemptCount < 5 && (
                    <p className="text-xs text-red-500 mt-1">
                      Attempt {attemptCount} of 5
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Lockout Warning */}
            {lockoutTime && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">
                    Account temporarily locked. Try again in {lockoutTime} seconds.
                  </p>
                </div>
              </div>
            )}
          </ClientOnly>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !!lockoutTime}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </>
            ) : lockoutTime ? (
              `Locked (${lockoutTime}s)`
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              href="/auth/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Create a new account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
