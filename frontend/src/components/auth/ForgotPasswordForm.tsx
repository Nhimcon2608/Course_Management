'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ForgotPasswordData } from '@/types';

const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<ForgotPasswordData>({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);

      console.log('🔄 Starting forgot password process...');

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Forgot password request successful');
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast.success('Password reset instructions sent!', {
          icon: '📧',
          duration: 5000
        });
      } else {
        console.error('❌ Forgot password request failed:', result);
        
        // Handle specific error cases
        if (response.status === 429) {
          const errorMessage = result.message || 'Too many requests. Please try again later.';
          setError('email', { 
            type: 'manual', 
            message: errorMessage 
          });
          toast.error(errorMessage);
        } else {
          const errorMessage = result.message || 'Failed to send password reset email. Please try again.';
          setError('email', { 
            type: 'manual', 
            message: errorMessage 
          });
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError('email', { 
        type: 'manual', 
        message: errorMessage 
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
  };

  if (isSubmitted) {
    return (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Check your email
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            We've sent password reset instructions to{' '}
            <span className="font-medium text-gray-900">{submittedEmail}</span>
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Important
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>The reset link will expire in 15 minutes</li>
                      <li>Check your spam folder if you don't see the email</li>
                      <li>The link can only be used once</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                type="button"
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
              >
                Send to a different email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1 relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              icon={Mail}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reset Instructions
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            We'll send you an email with instructions to reset your password.
            The link will be valid for 15 minutes.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
