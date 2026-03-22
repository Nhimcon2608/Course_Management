'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Palette,
  BarChart3,
  Smartphone,
  Brain,
  Camera,
  Briefcase,
  Globe,
  ArrowRight,
  Users,
  Loader,
  AlertCircle,
  TrendingUp,
  Shield,
  Cloud
} from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';

interface CourseCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  courseCount: number;
  featured?: boolean;
  isActive: boolean;
  order: number;
}

// Icon mapping for different category types
const getIconForCategory = (iconName?: string, categoryName?: string): React.ReactNode => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Code': <Code className="h-8 w-8" />,
    'Palette': <Palette className="h-8 w-8" />,
    'BarChart3': <BarChart3 className="h-8 w-8" />,
    'Smartphone': <Smartphone className="h-8 w-8" />,
    'Brain': <Brain className="h-8 w-8" />,
    'Camera': <Camera className="h-8 w-8" />,
    'Briefcase': <Briefcase className="h-8 w-8" />,
    'Globe': <Globe className="h-8 w-8" />,
    'TrendingUp': <TrendingUp className="h-8 w-8" />,
    'Shield': <Shield className="h-8 w-8" />,
    'Cloud': <Cloud className="h-8 w-8" />,
  };

  // Try to get icon by name first
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }

  // Fallback based on category name
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('web') || name.includes('lập trình')) return <Code className="h-8 w-8" />;
  if (name.includes('design') || name.includes('thiết kế')) return <Palette className="h-8 w-8" />;
  if (name.includes('data') || name.includes('ai')) return <BarChart3 className="h-8 w-8" />;
  if (name.includes('mobile')) return <Smartphone className="h-8 w-8" />;
  if (name.includes('machine learning') || name.includes('ai')) return <Brain className="h-8 w-8" />;
  if (name.includes('business') || name.includes('kinh doanh')) return <Briefcase className="h-8 w-8" />;
  if (name.includes('marketing')) return <TrendingUp className="h-8 w-8" />;
  if (name.includes('security') || name.includes('bảo mật')) return <Shield className="h-8 w-8" />;
  if (name.includes('cloud') || name.includes('devops')) return <Cloud className="h-8 w-8" />;

  // Default icon
  return <Code className="h-8 w-8" />;
};

// Color gradient mapping
const getGradientForCategory = (color?: string, categoryName?: string): string => {
  if (color) {
    // Convert hex color to gradient classes
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'from-blue-500 to-blue-600',
      '#10B981': 'from-green-500 to-green-600',
      '#8B5CF6': 'from-purple-500 to-purple-600',
      '#F59E0B': 'from-yellow-500 to-yellow-600',
      '#EF4444': 'from-red-500 to-red-600',
      '#06B6D4': 'from-cyan-500 to-cyan-600',
      '#DC2626': 'from-red-600 to-red-700',
      '#7C3AED': 'from-violet-500 to-violet-600',
    };

    if (colorMap[color]) {
      return colorMap[color];
    }
  }

  // Fallback gradients based on category name
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('web') || name.includes('lập trình')) return 'from-blue-500 to-blue-600';
  if (name.includes('design') || name.includes('thiết kế')) return 'from-purple-500 to-purple-600';
  if (name.includes('data') || name.includes('ai')) return 'from-green-500 to-green-600';
  if (name.includes('mobile')) return 'from-orange-500 to-orange-600';
  if (name.includes('business') || name.includes('kinh doanh')) return 'from-indigo-500 to-indigo-600';
  if (name.includes('marketing')) return 'from-red-500 to-red-600';
  if (name.includes('security') || name.includes('bảo mật')) return 'from-red-600 to-red-700';
  if (name.includes('cloud') || name.includes('devops')) return 'from-cyan-500 to-cyan-600';

  return 'from-gray-500 to-gray-600';
};

// Fallback categories in case API fails
const fallbackCategories: CourseCategory[] = [
  {
    _id: 'web-dev',
    name: 'Lập trình Web',
    slug: 'lap-trinh-web',
    description: 'Học lập trình web từ cơ bản đến nâng cao với các công nghệ hiện đại',
    icon: 'Code',
    color: '#3B82F6',
    courseCount: 45,
    featured: true,
    isActive: true,
    order: 1
  },
  {
    _id: 'mobile-dev',
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Phát triển ứng dụng di động cho iOS và Android',
    icon: 'Smartphone',
    color: '#10B981',
    courseCount: 28,
    featured: true,
    isActive: true,
    order: 2
  },
  {
    _id: 'data-science',
    name: 'Data Science & AI',
    slug: 'data-science-ai',
    description: 'Khoa học dữ liệu, machine learning và trí tuệ nhân tạo',
    icon: 'Brain',
    color: '#8B5CF6',
    courseCount: 32,
    featured: true,
    isActive: true,
    order: 3
  },
  {
    _id: 'ui-ux',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Thiết kế giao diện và trải nghiệm người dùng',
    icon: 'Palette',
    color: '#F59E0B',
    courseCount: 24,
    featured: true,
    isActive: true,
    order: 4
  },
  {
    _id: 'marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Marketing số, SEO, SEM và social media marketing',
    icon: 'TrendingUp',
    color: '#EF4444',
    courseCount: 19,
    featured: true,
    isActive: true,
    order: 5
  },
  {
    _id: 'devops',
    name: 'DevOps & Cloud',
    slug: 'devops-cloud',
    description: 'DevOps, cloud computing và infrastructure',
    icon: 'Cloud',
    color: '#06B6D4',
    courseCount: 16,
    featured: true,
    isActive: true,
    order: 6
  },
  {
    _id: 'security',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Bảo mật thông tin và an ninh mạng',
    icon: 'Shield',
    color: '#DC2626',
    courseCount: 12,
    featured: true,
    isActive: true,
    order: 7
  },
  {
    _id: 'business',
    name: 'Business & Management',
    slug: 'business-management',
    description: 'Quản lý kinh doanh và kỹ năng lãnh đạo',
    icon: 'Briefcase',
    color: '#7C3AED',
    courseCount: 21,
    featured: true,
    isActive: true,
    order: 8
  }
];



const CourseCategoriesSection: React.FC = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { getItemDelay } = useStaggeredAnimation(8, 0.1);

  // State management
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGridVisible, setGridVisible] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Create a correctly typed ref for the grid
  const divRef = useRef<HTMLDivElement>(null);

  // Setup the observer for the div element
  useEffect(() => {
    const element = divRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGridVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/categories?includeInactive=false');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.categories) {
        // Sort categories by order and limit to 8 for the landing page
        const sortedCategories = data.data.categories
          .filter((cat: CourseCategory) => cat.isActive)
          .sort((a: CourseCategory, b: CourseCategory) => a.order - b.order)
          .slice(0, 8);

        setCategories(sortedCategories);
        setUsingFallback(false);
        console.log(`✅ Loaded ${sortedCategories.length} categories from API`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      console.log('API failed, keeping fallback categories...');

      // Only set fallback if we don't already have categories
      if (categories.length === 0) {
        setCategories(fallbackCategories);
        setUsingFallback(true);
      }
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 CourseCategoriesSection mounted, loading categories...');
    console.log('📊 Fallback categories:', fallbackCategories.length);

    // Start with fallback data immediately to ensure something is shown
    setCategories(fallbackCategories);
    setUsingFallback(true);
    setLoading(false);
    setGridVisible(true); // Force grid to be visible

    console.log('✅ Categories set, loading:', false, 'categories count:', fallbackCategories.length);

    // Then try to fetch from API in background
    fetchCategories();
  }, []);

  return (
    <section ref={elementRef} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Explore Course Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover your passion and advance your career with our comprehensive range of courses across multiple disciplines
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>50,000+ Students</span>
            </div>
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>800+ Courses</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>95% Success Rate</span>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading categories...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Categories</h3>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && categories.length > 0 && (
          <div ref={divRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {categories.map((category, index) => {
              const categoryIcon = getIconForCategory(category.icon, category.name);
              const categoryGradient = getGradientForCategory(category.color, category.name);

              return (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={isGridVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: getItemDelay(index),
                    ease: 'easeOut'
                  }}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                  className="group relative"
                >
                  <Link href={`/categories/${category.slug}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 relative overflow-hidden">
                      {/* Featured badge */}
                      {category.featured && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Featured
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${categoryGradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {categoryIcon}
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {category.description || 'Explore courses in this category'}
                      </p>

                      {/* Course count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {category.courseCount} courses
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* No Categories State */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No categories available
            </h3>
            <p className="text-gray-600">
              Categories will appear here once they are added to the system.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-8 border border-primary-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Can't Find What You're Looking For?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We're constantly adding new courses and categories. Request a course or suggest a topic you'd like to learn about.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/request-course"
                className="btn-primary px-6 py-3"
              >
                Request a Course
              </Link>
              <Link 
                href="/categories"
                className="btn-outline px-6 py-3"
              >
                View All Categories
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CourseCategoriesSection;
