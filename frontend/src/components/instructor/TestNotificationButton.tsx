'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const TestNotificationButton: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTestNotification = async () => {
    try {
      setIsCreating(true);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          testType: 'assignment'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create test notification');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create test notification');
      }

      toast.success('Test assignment notification created! Check the bell icon.');
      
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Failed to create test notification');
    } finally {
      setIsCreating(false);
    }
  };

  // Show for testing (remove this in production)
  // if (process.env.NODE_ENV !== 'development') {
  //   return null;
  // }

  return (
    <button
      onClick={createTestNotification}
      disabled={isCreating}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {isCreating ? 'Creating...' : 'Test Assignment Notification'}
    </button>
  );
};

export default TestNotificationButton;
