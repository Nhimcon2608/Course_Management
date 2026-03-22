'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  DollarSign, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  Globe,
  Clock,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import InstructorApplicationForm from '@/components/forms/InstructorApplicationForm';

const BecomeInstructorPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: 'Earn Money',
      description: 'Set your own price and earn money from your expertise. Top instructors earn $10,000+ per month.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Reach Students Globally',
      description: 'Teach students from around the world and build a global community of learners.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Build Your Brand',
      description: 'Establish yourself as an expert in your field and grow your professional reputation.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Flexible Schedule',
      description: 'Create courses on your own time and work from anywhere in the world.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const requirements = [
    'Professional experience in your field (2+ years)',
    'Passion for teaching and helping others learn',
    'Ability to create engaging and structured content',
    'Good communication skills in English',
    'Reliable internet connection for video creation',
    'Commitment to student success and support'
  ];

  const stats = [
    { value: '50K+', label: 'Students Taught' },
    { value: '$2M+', label: 'Instructor Earnings' },
    { value: '150+', label: 'Expert Instructors' },
    { value: '4.8/5', label: 'Average Rating' }
  ];

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <button
                onClick={() => setShowForm(false)}
                className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
              >
                ← Back to Information
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Instructor Application
              </h1>
              <p className="text-gray-600">
                Fill out the form below to apply to become an instructor
              </p>
            </div>
            <InstructorApplicationForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Become an Instructor
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Share your expertise with thousands of students worldwide and build a rewarding teaching career
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-2xl"
              >
                <span className="flex items-center space-x-2">
                  <span>Apply Now</span>
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
              <Link 
                href="/instructors"
                className="btn-outline border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4"
              >
                Meet Our Instructors
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={elementRef} className="py-20 bg-gray-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Teach With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our community of expert instructors and enjoy the benefits of teaching on our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.color} flex items-center justify-center text-white mx-auto mb-6`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Requirements
              </h2>
              <p className="text-xl text-gray-600">
                To ensure the highest quality education, we have the following requirements for our instructors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {requirements.map((requirement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 leading-relaxed">{requirement}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Teaching?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of instructors who are already making an impact and earning money by sharing their knowledge
            </p>
            
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary bg-primary-600 hover:bg-primary-700 text-lg px-8 py-4 shadow-2xl"
            >
              <span className="flex items-center space-x-2">
                <span>Apply to Become an Instructor</span>
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>

            <div className="mt-12 flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Free to apply</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>No upfront costs</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Full support provided</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BecomeInstructorPage;
