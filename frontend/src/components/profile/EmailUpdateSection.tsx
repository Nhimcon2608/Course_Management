'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore, useAuthActions } from '@/store/authStore';
import { 
  Mail, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  Info,
  Lock
} from 'lucide-react';

interface EmailUpdateSectionProps {
  className?: string;
}

const EmailUpdateSection: React.FC<EmailUpdateSectionProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuthStore();
  const { updateProfile } = useAuthActions();
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleStartEdit = () => {
    setNewEmail(user?.email || '');
    setIsEditing(true);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setNewEmail('');
    setIsEditing(false);
    setShowConfirmation(false);
  };

  const handleSaveEmail = async () => {
    if (!newEmail || !user) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email is different
    if (newEmail === user.email) {
      toast('Email address is the same as current', { icon: 'ℹ️' });
      setIsEditing(false);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    if (!newEmail || !user) return;

    try {
      setIsUpdating(true);

      // TODO: Implement email update API call
      const response = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newEmail: newEmail.toLowerCase().trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user in auth store
        await updateProfile({
          email: newEmail.toLowerCase().trim(),
          isEmailVerified: false // Reset verification status
        });

        toast.success('Email updated successfully! Please verify your new email address.');
        setIsEditing(false);
        setShowConfirmation(false);
        setNewEmail('');
      } else {
        toast.error(data.message || 'Failed to update email address');
      }
    } catch (error) {
      console.error('Email update error:', error);
      toast.error('Failed to update email address');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Mail className="h-5 w-5 mr-2 text-blue-600" />
          Email Address Management
        </h2>
      </div>
      
      <div className="p-6">
        {!isEditing ? (
          /* Display Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Email Address
              </label>
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-900">{user.email}</span>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Change Email</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Important Notes
                  </h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Changing your email will require re-verification</li>
                    <li>• You'll temporarily lose access to verified features</li>
                    <li>• Make sure you have access to the new email address</li>
                    <li>• Your login credentials will remain the same</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : !showConfirmation ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new email address"
                autoFocus
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Email Change Warning
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing your email address will reset your verification status. 
                    You'll need to verify the new email before accessing all features.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveEmail}
                disabled={!newEmail || newEmail === user.email}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>Continue</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Mode */
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <Lock className="h-6 w-6 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Confirm Email Change
                  </h3>
                  <div className="space-y-2 text-sm text-red-700">
                    <p><strong>Current Email:</strong> {user.email}</p>
                    <p><strong>New Email:</strong> {newEmail}</p>
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                    <h4 className="font-medium text-red-800 mb-1">
                      This action will:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Change your email address to {newEmail}</li>
                      <li>• Reset your email verification status</li>
                      <li>• Send a verification email to the new address</li>
                      <li>• Temporarily restrict access to verified features</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Confirm Change</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isUpdating}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailUpdateSection;
