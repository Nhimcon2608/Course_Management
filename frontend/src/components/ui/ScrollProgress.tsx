'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScrollProgress } from '@/hooks/useScrollAnimation';

interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
}

const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className = '',
  color = 'bg-primary-500',
  height = 3,
}) => {
  const progress = useScrollProgress();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`fixed top-0 left-0 w-full z-50 ${className}`}>
        <div className={`w-full bg-gray-200/20 h-${height}`}>
          <div className={`h-full ${color} origin-left`} style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-0 left-0 w-full z-50 ${className}`}>
      <div className={`w-full bg-gray-200/20 h-${height}`}>
        <motion.div
          className={`h-full ${color} origin-left`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
};

export default ScrollProgress;
