import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export interface EmailVerificationError {
  code: string;
  action: string;
  message: string;
  resendUrl?: string;
}

export const isEmailVerificationError = (error: any): error is EmailVerificationError => {
  return error && error.code === 'EMAIL_VERIFICATION_REQUIRED';
};

export const handleEmailVerificationError = (error: any, router: any) => {
  if (isEmailVerificationError(error)) {
    toast.error(error.message, {
      icon: '📧',
      duration: 6000,
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B'
      }
    });
    
    // Redirect to verification page
    router.push('/auth/verify-email');
    return true;
  }
  return false;
};

export const showEmailVerificationToast = (message?: string) => {
  toast.error(message || 'Please verify your email address to access this feature', {
    icon: '📧',
    duration: 6000,
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B'
    }
  });
};

export const showEmailVerificationSuccessToast = () => {
  toast.success('Email verified successfully! You now have full access to all features.', {
    icon: '✅',
    duration: 5000,
    style: {
      background: '#D1FAE5',
      color: '#065F46',
      border: '1px solid #10B981'
    }
  });
};
