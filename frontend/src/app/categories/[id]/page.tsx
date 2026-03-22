'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  ChevronRight,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { categoryApi, Course, Category } from '@/services/api';

const levels = ['All Levels', 'beginner', 'intermediate', 'advanced'];
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
];

const CategoryCoursesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  
  // State
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryPath, setCategoryPath] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  useEffect(() => {
    fetchCategoryData();
  }, [params?.id, currentPage, searchTerm, selectedLevel, minPrice, maxPrice, sortBy]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        page: currentPage,
        limit: 12,
        sortBy
      };

      if (searchTerm) filters.search = searchTerm;
      if (selectedLevel !== 'All Levels') filters.level = selectedLevel;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);

      const response = await categoryApi.getCategoryCourses(params?.id as string, filters);
      
      if (response.success && response.data) {
        setCategory(response.data.category);
        setCategoryPath(response.data.categoryPath);
        setCourses(response.data.courses);
        
        const pagination = response.data.pagination;
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalItems(pagination.totalItems);
        setHasNextPage(pagination.hasNextPage);
        setHasPrevPage(pagination.hasPrevPage);
      } else {
        setError('Category not found');
      }
    } catch (err: any) {
      console.error('Error fetching category data:', err);
      setError(err.response?.data?.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCategoryData();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedLevel('All Levels');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
    setCurrentPage(1);
  };

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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={!hasPrevPage}
          className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 border rounded-md ${
              page === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow">
                  <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/categories"
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Browse All Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/categories" className="hover:text-primary-600">Categories</Link>
            {categoryPath.map((pathItem, index) => (
              <React.Fragment key={pathItem._id}>
                <ChevronRight className="h-4 w-4" />
                {index === categoryPath.length - 1 ? (
                  <span className="text-gray-900">{pathItem.name}</span>
                ) : (
                  <Link
                    href={`/categories/${pathItem.slug || pathItem._id}`}
                    className="hover:text-primary-600"
                  >
                    {pathItem.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {category.icon && (
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${category.color || 'bg-primary-100'}`}>
                {category.icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-gray-600 mt-2">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>{totalItems} courses</span>
            <span>{category.courseCount} total in category</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses in this category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center space-x-2 text-gray-600"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-gray-600">{totalItems} courses found</span>
            </div>
          </div>

          {/* Filters */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'All Levels' ? level : level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Courses Grid/List */}
        {courses.length > 0 ? (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {courses.map((course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course.slug || course._id}`}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className={viewMode === 'list' 
                      ? 'w-64 h-40 object-cover flex-shrink-0' 
                      : 'w-full h-48 object-cover'
                    }
                  />
                  <div className="p-6 flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                      {course.featured && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.shortDescription}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">by {course.instructor.name}</p>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {renderStars(course.rating)}
                        <span className="text-sm font-medium text-gray-900 ml-1">{course.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500 ml-2">({course.totalRatings.toLocaleString()})</span>
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{course.duration}h</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-3 w-3 mr-1" />
                        <span>{course.lessons.length} lessons</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{course.enrolledStudents.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">${course.price}</span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-sm text-gray-500 line-through">${course.originalPrice}</span>
                        )}
                      </div>
                      {course.discountPercentage && course.discountPercentage > 0 && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          {course.discountPercentage}% off
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={resetFilters}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCoursesPage;
