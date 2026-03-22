'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface WelcomePopupProps {
  onClose: () => void;
  onDismiss: () => void;
  onTemporaryClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ onClose, onDismiss, onTemporaryClose }) => {
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
          <Star className="h-8 w-8 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Welcome to Course Management!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600"
        >
          Discover thousands of courses and start your learning journey today
        </motion.p>
      </div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 mb-6"
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Expert-led courses</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Lifetime access</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Certificate of completion</span>
        </div>
      </motion.div>

      {/* Special Offer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 mb-6 border border-primary-200"
      >
        <div className="flex items-center space-x-2 mb-2">
          <Gift className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-primary-800">Special Offer</span>
        </div>
        <p className="text-sm text-primary-700">
          Get 20% off your first course purchase! Use code <strong>WELCOME20</strong>
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <Link
          href="/courses"
          onClick={onTemporaryClose}
          className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
        >
          <span>Explore Courses</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/auth/register"
          onClick={onTemporaryClose}
          className="w-full btn-outline flex items-center justify-center py-3"
        >
          Create Free Account
        </Link>

        <div className="flex space-x-2">
          <button
            onClick={onTemporaryClose}
            className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-2 px-3 rounded hover:bg-gray-100 transition-colors"
            title="Close for now, may show again later"
          >
            Maybe later
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 text-sm text-gray-500 hover:text-red-600 py-2 px-3 rounded hover:bg-red-50 transition-colors"
            title="Don't show again this session"
          >
            Don't show again
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePopup;
