'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'courses' | 'payment' | 'technical';
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I get started with my first course?',
    answer: 'Getting started is easy! Simply browse our course catalog, select a course that interests you, and click "Enroll Now". You\'ll have immediate access to all course materials, including videos, assignments, and community discussions.',
    category: 'general'
  },
  {
    id: '2',
    question: 'Are the courses self-paced or do they have fixed schedules?',
    answer: 'Most of our courses are self-paced, allowing you to learn at your own speed. However, we also offer live cohort-based courses with fixed schedules for those who prefer structured learning with deadlines and peer interaction.',
    category: 'courses'
  },
  {
    id: '3',
    question: 'Do I get a certificate upon completion?',
    answer: 'Yes! Upon successfully completing a course (including all assignments and projects), you\'ll receive a verified certificate that you can share on LinkedIn, add to your resume, or showcase in your portfolio.',
    category: 'courses'
  },
  {
    id: '4',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. We also offer flexible payment plans for premium courses, allowing you to pay in installments.',
    category: 'payment'
  },
  {
    id: '5',
    question: 'Is there a money-back guarantee?',
    answer: 'Absolutely! We offer a 30-day money-back guarantee on all courses. If you\'re not satisfied with your purchase for any reason, contact our support team within 30 days for a full refund.',
    category: 'payment'
  },
  {
    id: '6',
    question: 'Can I access courses on mobile devices?',
    answer: 'Yes! Our platform is fully responsive and works on all devices. We also have dedicated mobile apps for iOS and Android that allow you to download courses for offline viewing.',
    category: 'technical'
  },
  {
    id: '7',
    question: 'How long do I have access to a course after purchase?',
    answer: 'Once you purchase a course, you have lifetime access to all course materials. This includes any future updates or additional content added to the course.',
    category: 'courses'
  },
  {
    id: '8',
    question: 'Do you offer group discounts for teams or organizations?',
    answer: 'Yes! We offer special pricing for teams of 5 or more. Contact our sales team to discuss custom packages, bulk licensing, and enterprise solutions tailored to your organization\'s needs.',
    category: 'payment'
  }
];

const categories = [
  { id: 'all', label: 'All Questions', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'general', label: 'General', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'courses', label: 'Courses', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'payment', label: 'Payment', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'technical', label: 'Technical', icon: <HelpCircle className="h-4 w-4" /> }
];

const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: faqRef, isVisible: faqVisible, getItemDelay } = useStaggeredAnimation(8, 0.1);

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section ref={elementRef} className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our courses, platform, and services. Can't find what you're looking for? Contact our support team.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 shadow-sm'
              }`}
            >
              {category.icon}
              <span className="font-medium">{category.label}</span>
            </button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <div ref={faqRef} className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: getItemDelay(index) }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <div className={`flex-shrink-0 transition-transform duration-300 ${
                      openFAQ === faq.id ? 'rotate-180' : ''
                    }`}>
                      {openFAQ === faq.id ? (
                        <Minus className="h-5 w-5 text-primary-500" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {openFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0">
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-gray-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-8 border border-primary-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our support team is here to help! Get in touch with us and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@coursemanagement.com"
                className="btn-primary px-6 py-3"
              >
                Contact Support
              </a>
              <a 
                href="/help"
                className="btn-outline px-6 py-3"
              >
                Visit Help Center
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
