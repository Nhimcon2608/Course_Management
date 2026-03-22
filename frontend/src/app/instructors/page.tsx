'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Users, 
  BookOpen, 
  MapPin,
  Grid,
  List,
  ChevronDown,
  Loader
} from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';
import InstructorCard from '@/components/cards/InstructorCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Instructor {
  _id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  avatar?: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  experience: string;
  company?: string;
  location?: string;
  featured: boolean;
  verified: boolean;
}

interface Filters {
  search: string;
  expertise: string;
  rating: number;
  sortBy: string;
  sortOrder: string;
}

const InstructorsPage: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState<Filters>({
    search: '',
    expertise: '',
    rating: 0,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: instructorsRef, isVisible: instructorsVisible, getItemDelay } = useStaggeredAnimation(12, 0.1);

  useEffect(() => {
    fetchInstructors();
  }, [filters, pagination.page]);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.expertise && { expertise: filters.expertise }),
        ...(filters.rating && { rating: filters.rating.toString() }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`${API_BASE_URL}/instructors?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setInstructors(data.data.instructors);
        setFilteredInstructors(data.data.instructors);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
        setExpertiseAreas(data.data.filters.expertiseAreas);
      }
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      expertise: '',
      rating: 0,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Meet Our Expert Instructors
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Learn from industry professionals and experienced educators who are passionate about sharing their knowledge
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/become-instructor"
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100"
              >
                Become an Instructor
              </Link>
              <Link 
                href="/courses"
                className="btn-outline border-2 border-white/30 text-white hover:bg-white/10"
              >
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search instructors..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-6 bg-gray-50 rounded-lg"
            >
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expertise
                  </label>
                  <select
                    value={filters.expertise}
                    onChange={(e) => handleFilterChange('expertise', e.target.value)}
                    className="input"
                  >
                    <option value="">All Areas</option>
                    {expertiseAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                    className="input"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                    <option value={4.8}>4.8+ Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input"
                  >
                    <option value="rating">Rating</option>
                    <option value="studentsCount">Students</option>
                    <option value="name">Name</option>
                    <option value="joinedDate">Newest</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-outline w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      <section ref={elementRef} className="py-12">
        <div className="container">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading...' : `${pagination.total} Instructors Found`}
              </h2>
              {filters.search && (
                <p className="text-gray-600 mt-1">
                  Results for "{filters.search}"
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          )}

          {/* Instructors Grid/List */}
          {!loading && (
            <div ref={instructorsRef}>
              {viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredInstructors.map((instructor, index) => (
                    <motion.div
                      key={instructor._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={instructorsVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: getItemDelay(index) }}
                    >
                      <InstructorCard instructor={instructor} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInstructors.map((instructor, index) => (
                    <motion.div
                      key={instructor._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={instructorsVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: getItemDelay(index) }}
                    >
                      <InstructorCard instructor={instructor} layout="list" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredInstructors.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <Users className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No instructors found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InstructorsPage;
