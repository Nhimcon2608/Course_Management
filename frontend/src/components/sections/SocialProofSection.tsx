'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Award, TrendingUp } from 'lucide-react';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { partnerLogos } from '@/components/ui/PartnerLogos';

interface Partner {
  id: string;
  name: string;
  logo: string;
  category: 'tech' | 'university' | 'startup' | 'enterprise';
}

interface Achievement {
  id: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
}

const partners: Partner[] = [
  { id: '1', name: 'Google', logo: '', category: 'tech' },
  { id: '2', name: 'Microsoft', logo: '', category: 'tech' },
  { id: '3', name: 'Amazon', logo: '', category: 'tech' },
  { id: '4', name: 'Meta', logo: '', category: 'tech' },
  { id: '5', name: 'Stanford', logo: '', category: 'university' },
  { id: '6', name: 'MIT', logo: '', category: 'university' },
  { id: '7', name: 'Harvard', logo: '', category: 'university' },
  { id: '8', name: 'UC Berkeley', logo: '', category: 'university' },
  { id: '9', name: 'Stripe', logo: '', category: 'startup' },
  { id: '10', name: 'Airbnb', logo: '', category: 'startup' },
  { id: '11', name: 'Uber', logo: '', category: 'startup' },
  { id: '12', name: 'Spotify', logo: '', category: 'startup' },
];

const achievements: Achievement[] = [
  {
    id: '1',
    icon: <Users className="h-8 w-8" />,
    value: '500K+',
    label: 'Students Worldwide',
    description: 'Learners from 150+ countries trust our platform'
  },
  {
    id: '2',
    icon: <Building2 className="h-8 w-8" />,
    value: '2,000+',
    label: 'Partner Companies',
    description: 'Leading organizations choose our training programs'
  },
  {
    id: '3',
    icon: <Award className="h-8 w-8" />,
    value: '95%',
    label: 'Job Placement Rate',
    description: 'Students land jobs within 6 months of completion'
  },
  {
    id: '4',
    icon: <TrendingUp className="h-8 w-8" />,
    value: '89%',
    label: 'Salary Increase',
    description: 'Average salary boost after course completion'
  }
];

const SocialProofSection: React.FC = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: partnersRef, isVisible: partnersVisible, getItemDelay } = useStaggeredAnimation(12, 0.05);
  const { elementRef: achievementsRef, isVisible: achievementsVisible, getItemDelay: getAchievementDelay } = useStaggeredAnimation(4, 0.2);

  return (
    <section ref={elementRef} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-50 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals from top companies and universities who have advanced their careers through our platform
          </p>
        </motion.div>

        {/* Achievements Grid */}
        <div ref={achievementsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={achievementsVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: getAchievementDelay(index),
                ease: 'easeOut'
              }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                {achievement.icon}
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {achievement.value}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {achievement.label}
              </div>
              <div className="text-sm text-gray-600">
                {achievement.description}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partner Categories */}
        <div className="space-y-12">
          {/* Tech Companies */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-2xl font-bold text-gray-900 text-center mb-8"
            >
              Technology Partners
            </motion.h3>
            <div ref={partnersRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {partners.filter(p => p.category === 'tech').map((partner, index) => {
                const LogoComponent = partnerLogos.tech[partner.name as keyof typeof partnerLogos.tech];
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={partnersVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: getItemDelay(index) }}
                    className="group"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex items-center justify-center h-24">
                      {LogoComponent ? (
                        <LogoComponent className="w-28 h-12 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                      ) : (
                        <div className="w-24 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:from-primary-50 group-hover:to-primary-100 transition-all duration-300">
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-primary-600">
                            {partner.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Universities */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-2xl font-bold text-gray-900 text-center mb-8"
            >
              Academic Partners
            </motion.h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {partners.filter(p => p.category === 'university').map((partner, index) => {
                const LogoComponent = partnerLogos.university[partner.name as keyof typeof partnerLogos.university];
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={partnersVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: getItemDelay(index + 4) }}
                    className="group"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex items-center justify-center h-24">
                      {LogoComponent ? (
                        <LogoComponent className="w-28 h-12 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                      ) : (
                        <div className="w-24 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:from-purple-50 group-hover:to-purple-100 transition-all duration-300">
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-purple-600">
                            {partner.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Startups */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-2xl font-bold text-gray-900 text-center mb-8"
            >
              Startup Partners
            </motion.h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {partners.filter(p => p.category === 'startup').map((partner, index) => {
                const LogoComponent = partnerLogos.startup[partner.name as keyof typeof partnerLogos.startup];
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={partnersVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: getItemDelay(index + 8) }}
                    className="group"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex items-center justify-center h-24">
                      {LogoComponent ? (
                        <LogoComponent className="w-28 h-12 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                      ) : (
                        <div className="w-24 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:from-green-50 group-hover:to-green-100 transition-all duration-300">
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-green-600">
                            {partner.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-8 border border-primary-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join the Community of Success
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Be part of a global network of professionals who are transforming their careers and making an impact in their industries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/success-stories"
                className="btn-primary px-6 py-3"
              >
                Read Success Stories
              </a>
              <a 
                href="/partners"
                className="btn-outline px-6 py-3"
              >
                Become a Partner
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
