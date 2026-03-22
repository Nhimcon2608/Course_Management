'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
  course: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Frontend Developer',
    company: 'Tech Corp',
    avatar: '/api/placeholder/64/64',
    rating: 5,
    content: 'This platform completely transformed my career. The courses are well-structured and the instructors are incredibly knowledgeable. I landed my dream job within 3 months!',
    course: 'React Masterclass'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Data Scientist',
    company: 'Analytics Pro',
    avatar: '/api/placeholder/64/64',
    rating: 5,
    content: 'The hands-on projects and real-world applications made all the difference. I went from beginner to confident data scientist in just 6 months.',
    course: 'Data Science Bootcamp'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'UX Designer',
    company: 'Design Studio',
    avatar: '/api/placeholder/64/64',
    rating: 5,
    content: 'Amazing learning experience! The community support and mentor guidance helped me transition from marketing to UX design successfully.',
    course: 'UX/UI Design Complete'
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Full Stack Developer',
    company: 'StartupXYZ',
    avatar: '/api/placeholder/64/64',
    rating: 5,
    content: 'The comprehensive curriculum and practical projects gave me the confidence to build full-stack applications. Highly recommended!',
    course: 'Full Stack Development'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Product Manager',
    company: 'Innovation Inc',
    avatar: '/api/placeholder/64/64',
    rating: 5,
    content: 'Perfect blend of theory and practice. The course helped me understand both technical and business aspects of product management.',
    course: 'Product Management Pro'
  }
];

const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const { elementRef: gridRef, isVisible: gridVisible, getItemDelay } = useStaggeredAnimation(3, 0.2);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful students who have transformed their careers through our platform
          </p>
        </motion.div>

        {/* Main Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative"
            >
              <Quote className="absolute top-6 left-6 h-8 w-8 text-primary-200" />
              
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                    {testimonials[currentIndex].name.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex justify-center md:justify-start mb-4">
                    {renderStars(testimonials[currentIndex].rating)}
                  </div>
                  
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    "{testimonials[currentIndex].content}"
                  </p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-gray-600">
                      {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                    </p>
                    <p className="text-primary-600 text-sm font-medium mt-1">
                      Completed: {testimonials[currentIndex].course}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mb-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Testimonial Grid */}
        <div ref={gridRef} className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={gridVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: getItemDelay(index) }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed">
                "{testimonial.content.substring(0, 120)}..."
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
