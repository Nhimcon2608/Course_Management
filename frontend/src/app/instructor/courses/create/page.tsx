'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Upload,
  BookOpen,
  Clock,
  DollarSign,
  Users,
  Tag,
  FileText,
  CheckCircle
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, CreateCourseData } from '@/services/instructorDashboardApi';
import { categoryApi } from '@/services/api';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

const CreateCoursePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    shortDescription: '',
    price: 0,
    originalPrice: 0,
    category: '',
    level: 'beginner',
    duration: 0,
    requirements: [''],
    whatYouWillLearn: [''],
    tags: [''],
    thumbnail: 'https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=Course+Thumbnail'
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Create Course: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Create Course: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Create Course: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/courses/create');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Create Course: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }

      // Load categories if user is instructor
      loadCategories();
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  const loadCategories = async () => {
    try {
      setDataLoading(true);
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data.categories || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load categories. Please check your connection and try again.';
      toast.error(errorMessage);
      setCategories([]); // No mock data fallback
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCourseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'requirements' | 'whatYouWillLearn' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const addArrayItem = (field: 'requirements' | 'whatYouWillLearn' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'whatYouWillLearn' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Title validation
    if (!formData.title.trim()) {
      errors.push('Course title is required');
    } else if (formData.title.trim().length < 5) {
      errors.push('Course title must be at least 5 characters');
    } else if (formData.title.trim().length > 200) {
      errors.push('Course title cannot exceed 200 characters');
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.push('Course description is required');
    } else if (formData.description.trim().length < 50) {
      errors.push('Course description must be at least 50 characters');
    }

    // Short description validation
    if (!formData.shortDescription.trim()) {
      errors.push('Short description is required');
    } else if (formData.shortDescription.trim().length < 20) {
      errors.push('Short description must be at least 20 characters');
    } else if (formData.shortDescription.trim().length > 500) {
      errors.push('Short description cannot exceed 500 characters');
    }

    // Category validation
    if (!formData.category) {
      errors.push('Please select a category');
    }

    // Price validation
    if (formData.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    // Duration validation
    if (formData.duration < 0.5) {
      errors.push('Duration must be at least 0.5 hours');
    }

    // Thumbnail validation
    if (!formData.thumbnail || !formData.thumbnail.trim()) {
      errors.push('Thumbnail is required');
    }

    // What you will learn validation
    const learningOutcomes = formData.whatYouWillLearn?.filter(item => item.trim()) || [];
    if (learningOutcomes.length === 0) {
      errors.push('At least one learning outcome is required');
    }

    // Validate learning outcomes length
    for (const outcome of learningOutcomes) {
      if (outcome.length > 300) {
        errors.push('Learning outcomes cannot exceed 300 characters each');
        break;
      }
    }

    // Validate requirements length
    const requirements = formData.requirements?.filter(item => item.trim()) || [];
    for (const requirement of requirements) {
      if (requirement.length > 200) {
        errors.push('Requirements cannot exceed 200 characters each');
        break;
      }
    }

    // Validate tags length
    const tags = formData.tags?.filter(item => item.trim()) || [];
    for (const tag of tags) {
      if (tag.length > 50) {
        errors.push('Tags cannot exceed 50 characters each');
        break;
      }
    }

    return errors;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setLoading(true);

      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      // Filter out empty array items
      const cleanedData = {
        ...formData,
        requirements: formData.requirements?.filter(item => item.trim()) || [],
        whatYouWillLearn: formData.whatYouWillLearn?.filter(item => item.trim()) || [],
        tags: formData.tags?.filter(item => item.trim()) || []
      };

      const course = await instructorDashboardApi.createCourse(cleanedData);

      toast.success('Course created successfully!');
      router.push('/instructor/courses');
    } catch (error: any) {
      console.error('Failed to create course:', error);

      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data?.data) {
        const backendErrors = error.response.data.data;
        Object.values(backendErrors).forEach((err: any) => {
          if (err.message) {
            toast.error(err.message);
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to create course');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not instructor (will redirect)
  if (!isAuthenticated || user?.role !== 'instructor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600 mt-2">
                Fill in the details below to create your course
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    formData.title.length > 0 && formData.title.length < 5
                      ? 'border-red-300'
                      : formData.title.length > 200
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter course title (5-200 characters)"
                  required
                />
                <div className="mt-1 flex justify-between text-sm">
                  <span className={`${
                    formData.title.length < 5 && formData.title.length > 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {formData.title.length < 5 ? 'Minimum 5 characters required' : ''}
                  </span>
                  <span className={`${
                    formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {formData.title.length}/200
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description *
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    formData.shortDescription.length > 0 && formData.shortDescription.length < 20
                      ? 'border-red-300'
                      : formData.shortDescription.length > 500
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Brief description of your course (20-500 characters)"
                  required
                />
                <div className="mt-1 flex justify-between text-sm">
                  <span className={`${
                    formData.shortDescription.length < 20 && formData.shortDescription.length > 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {formData.shortDescription.length < 20 ? 'Minimum 20 characters required' : ''}
                  </span>
                  <span className={`${
                    formData.shortDescription.length > 500 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {formData.shortDescription.length}/500
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    formData.description.length > 0 && formData.description.length < 50
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Detailed description of your course (minimum 50 characters)"
                  required
                />
                <div className="mt-1 flex justify-between text-sm">
                  <span className={`${
                    formData.description.length < 50 && formData.description.length > 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {formData.description.length < 50 ? 'Minimum 50 characters required' : ''}
                  </span>
                  <span className="text-gray-500">
                    {formData.description.length} characters
                  </span>
                </div>
              </div>

              {/* Category and Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                    disabled={categories.length === 0}
                  >
                    <option value="">
                      {categories.length === 0 ? 'No categories available' : 'Select a category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <p className="text-sm text-red-600">Categories could not be loaded.</p>
                      <button
                        type="button"
                        onClick={loadCategories}
                        className="text-sm text-primary-600 hover:text-primary-700 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.5"
                    min="0.5"
                    step="0.5"
                    required
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL *
                </label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://example.com/course-thumbnail.jpg"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a URL for your course thumbnail image. Recommended size: 1280x720px.
                  You can use the default placeholder or upload your image to a service like Imgur, Cloudinary, or your own server.
                </p>
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              What You'll Learn *
            </h2>

            <div className="space-y-3">
              {formData.whatYouWillLearn?.map((outcome, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleArrayChange('whatYouWillLearn', index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        outcome.length > 300 ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="What will students learn? (max 300 characters)"
                      maxLength={300}
                    />
                    {formData.whatYouWillLearn && formData.whatYouWillLearn.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('whatYouWillLearn', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {outcome.length > 0 && (
                    <div className="text-right text-sm text-gray-500">
                      {outcome.length}/300
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('whatYouWillLearn')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add learning outcome
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Requirements
            </h2>

            <div className="space-y-3">
              {formData.requirements?.map((requirement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        requirement.length > 200 ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="What do students need to know? (max 200 characters)"
                      maxLength={200}
                    />
                    {formData.requirements && formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('requirements', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {requirement.length > 0 && (
                    <div className="text-right text-sm text-gray-500">
                      {requirement.length}/200
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add requirement
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Tags
            </h2>

            <div className="space-y-3">
              {formData.tags?.map((tag, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        tag.length > 50 ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Add a tag (max 50 characters)"
                      maxLength={50}
                    />
                    {formData.tags && formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {tag.length > 0 && (
                    <div className="text-right text-sm text-gray-500">
                      {tag.length}/50
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add tag
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCoursePage;
