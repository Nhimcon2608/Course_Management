'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthActions, useAuth } from '@/store/authStore';
import { RegisterData } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ClientOnly from '@/components/ui/ClientOnly';
import { triggerAuthChange } from '@/hooks/useAuthSync';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  rememberMe: boolean;
}

interface RegisterFormProps {
  redirectTo?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ redirectTo }) => {
  const router = useRouter();
  const { register: registerUser } = useAuthActions();
  const { isLoading, error, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const nameRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      rememberMe: false
    }
  });

  const password = watch('password');

  // Auto-focus name field
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use role-based redirect logic similar to LoginForm
      let destination = redirectTo;

      // If no specific destination, redirect based on role
      if (!destination) {
        destination = user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'instructor'
            ? '/instructor/dashboard'
            : '/dashboard';
      }

      console.log('🚀 Already authenticated, redirecting to:', destination);
      router.push(destination);
    }
  }, [isAuthenticated, user, router, redirectTo]);

  // Password strength calculation
  useEffect(() => {
    if (password) {
      let strength = 0;
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      const response = await registerUser(registerData);

      // Success toast
      toast.success('Account created successfully! Welcome aboard!', {
        icon: '🎉',
        duration: 4000
      });

      // Trigger auth change event
      triggerAuthChange();

      // Determine redirect destination based on user role
      let destination = redirectTo;

      // If no specific destination, redirect based on role from registration response
      if (!destination) {
        // Use the role from the registration response if available, otherwise fall back to form data
        const userRole = (response as any)?.user?.role || data.role;
        destination = userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'instructor'
            ? '/instructor/dashboard'
            : '/dashboard';
      }

      console.log('Registration successful, redirecting to:', destination);

      // Redirect after successful registration with role-based logic
      setTimeout(() => {
        router.push(destination);
      }, 1000);

    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      // Check if it's an Axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);

        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        icon: '❌',
        duration: 5000
      });

      setError('root', { message: errorMessage });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join us and start learning today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="relative">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                },
                maxLength: {
                  value: 50,
                  message: 'Name cannot exceed 50 characters'
                }
              })}
            />
            <User className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
          </div>

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

          {/* Role Selection Field */}
          <div className="relative">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="relative">
              <select
                id="role"
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                }`}
                {...register('role', {
                  required: 'Please select your role'
                })}
              >
                <option value="">Select your role</option>
                <option value="student">Học sinh (Student)</option>
                <option value="instructor">Giảng viên (Instructor)</option>
              </select>
              <UserCheck className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                }
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength
                          ? passwordStrength <= 2
                            ? 'bg-red-500'
                            : passwordStrength <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  Password strength: {
                    passwordStrength <= 2 ? 'Weak' :
                    passwordStrength <= 3 ? 'Medium' : 'Strong'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Keep me signed in for 30 days
            </label>
          </div>

          {/* Password Requirements */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li className={password && password.length >= 6 ? 'text-green-600' : ''}>
                At least 6 characters
              </li>
              <li className={password && /[A-Z]/.test(password) ? 'text-green-600' : ''}>
                One uppercase letter
              </li>
              <li className={password && /[a-z]/.test(password) ? 'text-green-600' : ''}>
                One lowercase letter
              </li>
              <li className={password && /\d/.test(password) ? 'text-green-600' : ''}>
                One number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {(error || errors.root) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                {error || errors.root?.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Terms and Privacy */}
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign in to your account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
