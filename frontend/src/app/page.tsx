'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  ShoppingCart,
  BarChart3,
  Star,
  Award,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useScrollAnimation, useParallax, useCountUp, useTypewriter } from '@/hooks/useScrollAnimation';
import { formatNumber } from '@/lib/utils';
import { usePopupManager } from '@/hooks/usePopupManager';
import Modal from '@/components/ui/Modal';
import WelcomePopup from '@/components/popups/WelcomePopup';
import NewsletterPopup from '@/components/popups/NewsletterPopup';
import Timeline from '@/components/ui/Timeline';
import { useAuth } from '@/store/authStore';
import ScrollProgress from '@/components/ui/ScrollProgress';
import FloatingParticles from '@/components/ui/FloatingParticles';
import TestimonialsSection from '@/components/sections/TestimonialsSection';

import SuccessStoriesSection from '@/components/sections/SuccessStoriesSection';
import InstructorSpotlightSection from '@/components/sections/InstructorSpotlightSection';
import FAQSection from '@/components/sections/FAQSection';
import SocialProofSection from '@/components/sections/SocialProofSection';

// StatCard component for hero stats
const StatCard = ({ number, label, suffix = '' }: { number: number; label: string; suffix?: string }) => {
  const { elementRef, count } = useCountUp(number, 2000);

  return (
    <div ref={elementRef as any} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
        {formatNumber(count)}{suffix}
      </div>
      <div className="text-blue-200 text-sm md:text-base">{label}</div>
    </div>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Quality Courses",
      description: "Learn from industry experts with carefully crafted curriculum and hands-on projects.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Global Community",
      description: "Connect with fellow learners worldwide and build your professional network.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Easy Purchase",
      description: "Simple and secure checkout process with flexible payment options.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and achievements.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Certificates",
      description: "Earn industry-recognized certificates to showcase your skills.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Lifetime Access",
      description: "Learn at your own pace with unlimited access to course materials.",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  return (
    <section ref={elementRef as any} className="py-20 bg-gray-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We provide everything you need to succeed in your learning journey with cutting-edge technology and expert support.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="card-hover p-8 text-center h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section Component
const StatsSection = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.3 });

  const stats = [
    { number: 50000, label: "Active Students", suffix: "+" },
    { number: 1200, label: "Courses Available", suffix: "+" },
    { number: 150, label: "Expert Instructors", suffix: "+" },
    { number: 98, label: "Success Rate", suffix: "%" },
    { number: 24, label: "Countries", suffix: "+" },
    { number: 4.8, label: "Average Rating", suffix: "/5" }
  ];

  return (
    <section ref={elementRef as any} className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trusted by Learners Worldwide
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join millions of students who have transformed their careers through our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <StatCard number={stat.number} label={stat.label} suffix={stat.suffix} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Timeline Section Component
const TimelineSection = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  const timelineItems = [
    {
      id: '1',
      title: 'Platform Launch',
      description: 'Launched our comprehensive learning platform with 100+ courses',
      date: 'January 2023',
      type: 'milestone' as const,
      status: 'completed' as const,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: '2',
      title: 'Mobile App Release',
      description: 'Released mobile apps for iOS and Android with offline learning',
      date: 'March 2023',
      type: 'announcement' as const,
      status: 'completed' as const,
      color: 'from-green-500 to-green-600'
    },
    {
      id: '3',
      title: 'AI-Powered Recommendations',
      description: 'Introduced personalized course recommendations using machine learning',
      date: 'June 2023',
      type: 'promotion' as const,
      status: 'completed' as const,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: '4',
      title: 'Live Coding Sessions',
      description: 'Weekly live coding sessions with industry experts',
      date: 'September 2023',
      type: 'event' as const,
      status: 'active' as const,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: '5',
      title: 'Certification Program',
      description: 'Launch of industry-recognized certification program',
      date: 'December 2023',
      type: 'announcement' as const,
      status: 'upcoming' as const,
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <section ref={elementRef as any} className="py-20 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Journey & Milestones
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our platform's evolution and upcoming features that will enhance your learning experience
          </p>
        </motion.div>

        <Timeline
          items={timelineItems}
          animated={true}
          className="max-w-4xl mx-auto"
        />
      </div>
    </section>
  );
};

// CTA Section Component
const CTASection = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section ref={elementRef as any} className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands of students who are already advancing their careers with our comprehensive courses.
            Start learning today and unlock your potential.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link
              href="/auth/register"
              className="btn-primary text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <span>Start Your Journey Today</span>
                <ArrowRight className="h-5 w-5" />
              </span>
            </Link>

            <Link
              href="/courses"
              className="btn-outline border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 backdrop-blur-sm"
            >
              Browse All Courses
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer Section Component
const FooterSection = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Course Management</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Empowering learners worldwide with quality education and comprehensive course management.
              Join millions of students transforming their careers through our platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <span className="sr-only">Facebook</span>
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <span className="sr-only">Twitter</span>
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 Course Management System. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>4.8/5 Rating</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { activePopup, triggerPopup, closePopup } = usePopupManager();
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Parallax effect for hero background
  const { elementRef: heroRef, offset } = useParallax(0.5);

  // Initialize popups for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      // Welcome popup - show after 3 seconds
      triggerPopup({
        id: 'welcome',
        type: 'welcome',
        title: 'Welcome',
        content: (
          <WelcomePopup
            onClose={() => closePopup('close')}
            onDismiss={() => closePopup('dismiss')}
            onTemporaryClose={() => closePopup('close')}
          />
        ),
        trigger: { type: 'time', value: 3 },
        conditions: { maxShowCount: 3, cooldownDays: 1, userType: 'guest' },
        priority: 10,
      });

      // Newsletter popup - show on 50% scroll
      triggerPopup({
        id: 'newsletter',
        type: 'newsletter',
        title: 'Newsletter',
        content: (
          <NewsletterPopup
            onClose={() => closePopup('close')}
            onDismiss={() => closePopup('dismiss')}
            onTemporaryClose={() => closePopup('close')}
          />
        ),
        trigger: { type: 'scroll', value: 50 },
        conditions: { maxShowCount: 2, cooldownDays: 7, userType: 'guest' },
        priority: 5,
      });
    }
  }, [isAuthenticated, triggerPopup, closePopup]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Header with Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)`,
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <FloatingParticles count={80} className="opacity-30" />
          <div
            className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"
            style={{ transform: `translateY(${offset * 0.3}px)` }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float"
            style={{
              transform: `translateY(${offset * 0.5}px)`,
              animationDelay: '1s'
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float"
            style={{
              transform: `translate(-50%, -50%) translateY(${offset * 0.2}px)`,
              animationDelay: '2s'
            }}
          />
        </div>

        <div className="container relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-responsive-xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Learn, Grow, and{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Excel
              </span>
            </motion.h1>

            <motion.p
              className="text-responsive-md mb-8 max-w-3xl mx-auto text-blue-100 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover thousands of courses from expert instructors and advance your career with our comprehensive learning platform. Join millions of learners worldwide.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                href="/courses"
                className="btn-primary text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <span>Explore Courses</span>
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>

              <button
                onClick={() => setShowVideoModal(true)}
                className="btn-ghost border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 backdrop-blur-sm"
              >
                <span className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Watch Demo</span>
                </span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <StatCard number={50000} label="Students" suffix="+" />
              <StatCard number={1200} label="Courses" suffix="+" />
              <StatCard number={150} label="Instructors" suffix="+" />
              <StatCard number={98} label="Success Rate" suffix="%" />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <FeaturesSection />



      {/* Stats Section */}
      <StatsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Success Stories Section */}
      <SuccessStoriesSection />

      {/* Instructor Spotlight Section */}
      <InstructorSpotlightSection />

      {/* Social Proof Section */}
      <SocialProofSection />

      {/* Timeline Section */}
      <TimelineSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <FooterSection />

      {/* Modals */}
      {activePopup && (
        <Modal
          isOpen={true}
          onClose={() => closePopup('close')}
          showCloseButton={true}
          size="md"
          closeOnOverlayClick={false}
          closeOnEscape={true}
        >
          {activePopup.content}
        </Modal>
      )}

      {showVideoModal && (
        <Modal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          title="Platform Demo"
          size="xl"
        >
          <div className="p-6">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Demo video would be embedded here</p>
                <p className="text-sm text-gray-400 mt-2">
                  This would typically contain a YouTube or Vimeo embed
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
