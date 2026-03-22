'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Users, TrendingUp, Filter } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { categoryApi, Category } from '@/services/api';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fallback categories data
  const fallbackCategories: Category[] = [
    {
      _id: 'web-dev',
      name: 'Lập trình Web',
      slug: 'lap-trinh-web',
      description: 'Học lập trình web từ cơ bản đến nâng cao với các công nghệ hiện đại',
      icon: '💻',
      color: '#3B82F6',
      courseCount: 45,
      featured: true,
      isActive: true,
      order: 1,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'mobile-dev',
      name: 'Mobile Development',
      slug: 'mobile-development',
      description: 'Phát triển ứng dụng di động cho iOS và Android',
      icon: '📱',
      color: '#10B981',
      courseCount: 28,
      featured: true,
      isActive: true,
      order: 2,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'data-science',
      name: 'Data Science & AI',
      slug: 'data-science-ai',
      description: 'Khoa học dữ liệu, machine learning và trí tuệ nhân tạo',
      icon: '🧠',
      color: '#8B5CF6',
      courseCount: 32,
      featured: true,
      isActive: true,
      order: 3,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'ui-ux',
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'Thiết kế giao diện và trải nghiệm người dùng',
      icon: '🎨',
      color: '#F59E0B',
      courseCount: 24,
      featured: true,
      isActive: true,
      order: 4,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'marketing',
      name: 'Digital Marketing',
      slug: 'digital-marketing',
      description: 'Marketing số, SEO, SEM và social media marketing',
      icon: '📈',
      color: '#EF4444',
      courseCount: 19,
      featured: true,
      isActive: true,
      order: 5,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'devops',
      name: 'DevOps & Cloud',
      slug: 'devops-cloud',
      description: 'DevOps, cloud computing và infrastructure',
      icon: '☁️',
      color: '#06B6D4',
      courseCount: 16,
      featured: true,
      isActive: true,
      order: 6,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'security',
      name: 'Cybersecurity',
      slug: 'cybersecurity',
      description: 'Bảo mật thông tin và an ninh mạng',
      icon: '🛡️',
      color: '#DC2626',
      courseCount: 12,
      featured: true,
      isActive: true,
      order: 7,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'business',
      name: 'Business & Management',
      slug: 'business-management',
      description: 'Quản lý kinh doanh và kỹ năng lãnh đạo',
      icon: '💼',
      color: '#7C3AED',
      courseCount: 21,
      featured: true,
      isActive: true,
      order: 8,
      level: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoryApi.getCategories();

      if (response.success && response.data) {
        setCategories(response.data.categories);
        console.log(`✅ Loaded ${response.data.categories.length} categories from API`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      console.log('Using fallback categories...');

      // Use fallback categories instead of showing error
      setCategories(fallbackCategories);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFeatured = !showFeaturedOnly || category.featured;
    return matchesSearch && matchesFeatured;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Course Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover a wide range of subjects and find the perfect courses to advance your skills
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Featured Only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category._id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Icon and Featured Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200 ${
                      category.color ? `bg-[${category.color}] text-white` : 'bg-primary-100 text-primary-600'
                    }`}>
                      {category.icon || '📚'}
                    </div>
                    {category.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Category Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description || 'Explore courses in this category'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{category.courseCount} courses</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Featured Categories Section */}
        {!loading && categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Featured Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories
                .filter(cat => cat.featured)
                .slice(0, 4)
                .map((category) => (
                  <Link
                    key={category._id}
                    href={`/categories/${category._id}`}
                    className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-shadow"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg mx-auto mb-2 ${
                      category.color ? `bg-[${category.color}] text-white` : 'bg-primary-100 text-primary-600'
                    }`}>
                      {category.icon || '📚'}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.courseCount} courses
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
