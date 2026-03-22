'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Clock, 
  MapPin, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useScrollAnimation, useCountUp } from '@/hooks/useScrollAnimation';
import { formatNumber } from '@/lib/utils';

interface SuccessStory {
  id: string;
  name: string;
  previousRole: string;
  currentRole: string;
  company: string;
  location: string;
  avatar: string;
  salaryIncrease: string;
  timeToSuccess: string;
  course: string;
  story: string;
  achievements: string[];
  linkedIn?: string;
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    previousRole: 'Retail Manager',
    currentRole: 'Senior Frontend Developer',
    company: 'Google',
    location: 'San Francisco, CA',
    avatar: '/api/placeholder/80/80',
    salaryIncrease: '180%',
    timeToSuccess: '8 months',
    course: 'Full Stack Web Development',
    story: 'After 5 years in retail management, I decided to pursue my passion for technology. The comprehensive curriculum and hands-on projects gave me the confidence to apply for developer positions. Within 8 months, I landed my dream job at Google!',
    achievements: [
      'Completed 12 projects in portfolio',
      'Contributed to 3 open-source projects',
      'Received job offers from 5 companies',
      'Mentoring 10+ new students'
    ],
    linkedIn: 'https://linkedin.com/in/alexthompson'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    previousRole: 'Marketing Assistant',
    currentRole: 'Data Scientist',
    company: 'Netflix',
    location: 'Los Angeles, CA',
    avatar: '/api/placeholder/80/80',
    salaryIncrease: '220%',
    timeToSuccess: '10 months',
    course: 'Data Science & Machine Learning',
    story: 'I always loved working with data but lacked the technical skills. This platform provided the perfect blend of theory and practical application. Now I\'m building recommendation algorithms at Netflix!',
    achievements: [
      'Built 8 ML models from scratch',
      'Published 2 research papers',
      'Won company hackathon',
      'Leading a team of 6 analysts'
    ],
    linkedIn: 'https://linkedin.com/in/mariarodriguez'
  },
  {
    id: '3',
    name: 'James Kim',
    previousRole: 'Graphic Designer',
    currentRole: 'Senior UX Designer',
    company: 'Apple',
    location: 'Cupertino, CA',
    avatar: '/api/placeholder/80/80',
    salaryIncrease: '150%',
    timeToSuccess: '6 months',
    course: 'UX/UI Design Masterclass',
    story: 'Transitioning from print design to digital was challenging, but the UX course opened up a whole new world. The user research and prototyping skills I learned landed me a position at Apple.',
    achievements: [
      'Designed 15+ user interfaces',
      'Conducted 50+ user interviews',
      'Improved app engagement by 40%',
      'Speaking at design conferences'
    ],
    linkedIn: 'https://linkedin.com/in/jameskim'
  }
];

const SuccessStoriesSection: React.FC = () => {
  const [currentStory, setCurrentStory] = useState(0);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  const nextStory = () => {
    setCurrentStory((prev) => (prev + 1) % successStories.length);
  };

  const prevStory = () => {
    setCurrentStory((prev) => (prev - 1 + successStories.length) % successStories.length);
  };

  const StatCard = ({ icon, value, label, suffix = '' }: { 
    icon: React.ReactNode; 
    value: number; 
    label: string; 
    suffix?: string;
  }) => {
    const { elementRef, count } = useCountUp(value, 2000);
    
    return (
      <div ref={elementRef as any} className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
          {icon}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {formatNumber(count)}{suffix}
        </div>
        <div className="text-primary-100 text-sm">{label}</div>
      </div>
    );
  };

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Success Stories That Inspire
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real people, real transformations. See how our students have changed their lives and advanced their careers.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          <StatCard icon={<TrendingUp className="h-6 w-6" />} value={89} label="Avg Salary Increase" suffix="%" />
          <StatCard icon={<Clock className="h-6 w-6" />} value={6} label="Avg Time to Job" suffix=" months" />
          <StatCard icon={<Award className="h-6 w-6" />} value={95} label="Job Placement Rate" suffix="%" />
          <StatCard icon={<DollarSign className="h-6 w-6" />} value={75000} label="Avg Starting Salary" suffix="+" />
        </motion.div>

        {/* Main Story */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Story Content */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold mr-6">
                      {successStories[currentStory].name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {successStories[currentStory].name}
                      </h3>
                      <p className="text-gray-300">
                        {successStories[currentStory].currentRole} at {successStories[currentStory].company}
                      </p>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {successStories[currentStory].location}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-green-400 text-2xl font-bold">
                        +{successStories[currentStory].salaryIncrease}
                      </div>
                      <div className="text-gray-300 text-sm">Salary Increase</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-blue-400 text-2xl font-bold">
                        {successStories[currentStory].timeToSuccess}
                      </div>
                      <div className="text-gray-300 text-sm">Time to Success</div>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-6">
                    {successStories[currentStory].story}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-white font-semibold mb-3">Key Achievements:</h4>
                    <ul className="space-y-2">
                      {successStories[currentStory].achievements.map((achievement, index) => (
                        <li key={index} className="flex items-center text-gray-300 text-sm">
                          <Award className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {successStories[currentStory].linkedIn && (
                    <a
                      href={successStories[currentStory].linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <span>Connect on LinkedIn</span>
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </div>

                {/* Career Transition Visual */}
                <div className="relative">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-white font-semibold mb-4 text-center">Career Transformation</h4>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-1">From</div>
                        <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg">
                          {successStories[currentStory].previousRole}
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <TrendingUp className="h-8 w-8 text-green-400" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-1">To</div>
                        <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg">
                          {successStories[currentStory].currentRole}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <div className="text-primary-400 text-sm font-medium">
                        Course Completed
                      </div>
                      <div className="text-white font-semibold">
                        {successStories[currentStory].course}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={prevStory}
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex space-x-2">
              {successStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStory(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStory ? 'bg-primary-400' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextStory}
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
