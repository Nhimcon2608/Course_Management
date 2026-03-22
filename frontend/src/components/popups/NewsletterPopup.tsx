'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewsletterPopupProps {
  onClose: () => void;
  onDismiss: () => void;
  onTemporaryClose: () => void;
}

const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ onClose, onDismiss, onTemporaryClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      toast.success('Successfully subscribed to newsletter!');
      
      // Auto close after success (temporary close since user engaged)
      setTimeout(() => {
        onTemporaryClose();
      }, 2000);
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="h-8 w-8 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're all set!
        </h2>
        
        <p className="text-gray-600">
          Thank you for subscribing. You'll receive our latest course updates and exclusive offers.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Mail className="h-8 w-8 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Stay Updated!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600"
        >
          Get the latest course updates, exclusive offers, and learning tips delivered to your inbox.
        </motion.p>
      </div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 rounded-lg p-4 mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-3">You'll receive:</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-700">New course announcements</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Exclusive discounts & offers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Learning tips & resources</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Industry insights</span>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full input"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Subscribing...</span>
            </div>
          ) : (
            'Subscribe to Newsletter'
          )}
        </button>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onTemporaryClose}
            className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-2 px-3 rounded hover:bg-gray-100 transition-colors"
            title="Close for now, may show again later"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 text-sm text-gray-500 hover:text-red-600 py-2 px-3 rounded hover:bg-red-50 transition-colors"
            title="Don't show again this session"
          >
            No thanks
          </button>
        </div>
      </motion.form>

      {/* Privacy note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-gray-500 text-center mt-4"
      >
        We respect your privacy. Unsubscribe at any time.
      </motion.p>
    </div>
  );
};

export default NewsletterPopup;
