'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Users, 
  BookOpen, 
  Award, 
  ExternalLink,
  Play,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';

interface Instructor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  avatar: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  experience: string;
  bio: string;
  achievements: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  featured?: boolean;
}

const instructors: Instructor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    title: 'Senior Software Engineer at Google',
    expertise: ['React', 'Node.js', 'TypeScript', 'System Design'],
    avatar: '/api/placeholder/120/120',
    rating: 4.9,
    studentsCount: 15420,
    coursesCount: 8,
    experience: '12+ years',
    bio: 'Former tech lead at Google with expertise in building scalable web applications. Passionate about teaching modern web development practices.',
    achievements: [
      'Led development of Google Search features',
      'Published 15+ technical articles',
      'Speaker at React Conf 2023',
      'Mentor to 100+ developers'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/sarahchen',
      website: 'https://sarahchen.dev'
    },
    featured: true
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'Principal Data Scientist at Netflix',
    expertise: ['Python', 'Machine Learning', 'Deep Learning', 'MLOps'],
    avatar: '/api/placeholder/120/120',
    rating: 4.8,
    studentsCount: 12350,
    coursesCount: 6,
    experience: '10+ years',
    bio: 'Data science expert who has built recommendation systems used by millions. Specializes in practical machine learning applications.',
    achievements: [
      'Built Netflix recommendation engine',
      'PhD in Computer Science from MIT',
      'Published 20+ research papers',
      'Kaggle Grandmaster'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/marcusjohnson',
      website: 'https://marcusml.com'
    },
    featured: true
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Head of Design at Airbnb',
    expertise: ['UX Design', 'Design Systems', 'Figma', 'User Research'],
    avatar: '/api/placeholder/120/120',
    rating: 4.9,
    studentsCount: 9870,
    coursesCount: 5,
    experience: '8+ years',
    bio: 'Award-winning designer who has shaped user experiences for millions of travelers. Expert in design thinking and user-centered design.',
    achievements: [
      'Redesigned Airbnb mobile app',
      'Winner of UX Design Awards 2022',
      'Featured in Design Weekly',
      'Mentor at Design+Research'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/emilyrodriguez',
      twitter: 'https://twitter.com/emilyux'
    },
    featured: true
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'DevOps Engineer at Amazon',
    expertise: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    avatar: '/api/placeholder/120/120',
    rating: 4.7,
    studentsCount: 8540,
    coursesCount: 4,
    experience: '9+ years',
    bio: 'Cloud infrastructure expert who has scaled systems to handle millions of requests. Passionate about DevOps best practices.',
    achievements: [
      'Architected AWS solutions for Fortune 500',
      'AWS Certified Solutions Architect',
      'Speaker at DevOps conferences',
      'Open source contributor'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/davidkim',
      website: 'https://davidkim.cloud'
    }
  }
];

const InstructorSpotlightSection: React.FC = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: gridRef, isVisible: gridVisible, getItemDelay } = useStaggeredAnimation(4, 0.15);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Learn from Industry Experts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our instructors are seasoned professionals from top tech companies, bringing real-world experience directly to your learning journey.
          </p>
        </motion.div>

        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {instructors.map((instructor, index) => (
            <motion.div
              key={instructor.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={gridVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: getItemDelay(index),
                ease: 'easeOut'
              }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 relative overflow-hidden">
                {/* Featured badge */}
                {instructor.featured && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Featured
                  </div>
                )}

                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                    {instructor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Name and Title */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {instructor.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {instructor.title}
                  </p>
                  <p className="text-xs text-primary-600 font-medium">
                    {instructor.experience} experience
                  </p>
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-center space-x-4 mb-4 text-sm">
                  <div className="flex items-center space-x-1">
                    {renderStars(instructor.rating)}
                    <span className="text-gray-600 ml-1">{instructor.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-primary-600 mb-1">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm font-semibold">
                        {instructor.studentsCount.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-primary-600 mb-1">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span className="text-sm font-semibold">
                        {instructor.coursesCount}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {instructor.expertise.slice(0, 3).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {instructor.expertise.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        +{instructor.expertise.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                  {instructor.bio}
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    href={`/instructors/${instructor.id}`}
                    className="flex-1 btn-primary text-xs py-2 text-center"
                  >
                    View Profile
                  </Link>
                  <button className="btn-outline text-xs py-2 px-3">
                    <MessageCircle className="h-3 w-3" />
                  </button>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-8 border border-primary-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to Become an Instructor?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Share your expertise with thousands of students worldwide. Join our community of expert instructors and make an impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/become-instructor"
                className="btn-primary px-6 py-3"
              >
                Become an Instructor
              </Link>
              <Link 
                href="/instructors"
                className="btn-outline px-6 py-3"
              >
                View All Instructors
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InstructorSpotlightSection;
