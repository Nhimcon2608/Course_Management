'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star, Gift, Trophy, Zap } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'promotion' | 'event' | 'milestone' | 'announcement';
  status: 'completed' | 'active' | 'upcoming';
  icon?: React.ReactNode;
  color?: string;
  link?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  showConnector?: boolean;
  animated?: boolean;
}

const defaultIcons = {
  promotion: <Gift className="h-5 w-5" />,
  event: <Calendar className="h-5 w-5" />,
  milestone: <Trophy className="h-5 w-5" />,
  announcement: <Zap className="h-5 w-5" />,
};

const statusColors = {
  completed: 'bg-success-500 border-success-500',
  active: 'bg-primary-500 border-primary-500',
  upcoming: 'bg-gray-300 border-gray-300',
};

const statusTextColors = {
  completed: 'text-success-700',
  active: 'text-primary-700',
  upcoming: 'text-gray-500',
};

const Timeline: React.FC<TimelineProps> = ({
  items,
  className,
  orientation = 'vertical',
  showConnector = true,
  animated = true,
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as any,
      },
    },
  };

  if (orientation === 'horizontal') {
    return (
      <div
        ref={elementRef as any}
        className={cn('w-full overflow-x-auto', className)}
      >
        <motion.div
          variants={animated ? containerVariants : undefined}
          initial={animated ? 'hidden' : undefined}
          animate={animated && isVisible ? 'visible' : undefined}
          className="flex items-center space-x-8 min-w-max px-4 py-8"
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={animated ? itemVariants : undefined}
              className="flex flex-col items-center text-center max-w-xs"
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-full border-4 flex items-center justify-center text-white mb-4',
                  statusColors[item.status],
                  'shadow-lg hover:shadow-xl transition-shadow duration-300'
                )}
              >
                {item.icon || defaultIcons[item.type]}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className={cn('font-semibold text-lg', statusTextColors[item.status])}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {item.date}
                </div>
              </div>

              {/* Connector */}
              {showConnector && index < items.length - 1 && (
                <div className="absolute top-6 left-full w-8 h-0.5 bg-gray-300 transform translate-x-4" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={elementRef as any}
      className={cn('relative', className)}
    >
      <motion.div
        variants={animated ? containerVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated && isVisible ? 'visible' : undefined}
        className="space-y-8"
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={animated ? itemVariants : undefined}
            className="relative flex items-start space-x-6"
          >
            {/* Connector Line */}
            {showConnector && index < items.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-300" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-full border-4 flex items-center justify-center text-white flex-shrink-0',
                statusColors[item.status],
                'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110'
              )}
            >
              {item.icon || defaultIcons[item.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start justify-between mb-3">
                  <h3 className={cn('font-semibold text-lg', statusTextColors[item.status])}>
                    {item.title}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      item.status === 'completed' && 'bg-success-100 text-success-700',
                      item.status === 'active' && 'bg-primary-100 text-primary-700',
                      item.status === 'upcoming' && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {item.date}
                  </div>
                  
                  {item.link && (
                    <a
                      href={item.link}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Timeline;
