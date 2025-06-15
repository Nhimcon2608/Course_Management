'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api';
import {
  Save,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  DollarSign,
  User,
  Tag,
  Image,
  FileText,
  Settings,
  AlertTriangle,
  Eye,
  Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Instructor {
  _id: string;
  name: string;
  email: string;
}

interface Lesson {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: any;
  price: number;
  discountPrice: number;
  thumbnail: string;
  instructor: any;
  status: 'draft' | 'published' | 'archived';
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration: number;
  tags: string[];
  requirements: string[];
  whatYouWillLearn: string[];
  lessons: Lesson[];
  isPublished: boolean;
  isFeatured: boolean;
  enrolledStudents: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [errors, setErrors] = useState<any>({});
  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newLearningPoint, setNewLearningPoint] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    if (params?.courseId) {
      fetchCourseData();
    }
  }, [isAuthenticated, user, router, params?.courseId]);

  const fetchCourseData = async () => {
    try {
      setInitialLoading(true);
      
      const [courseRes, categoriesRes, instructorsRes] = await Promise.all([
        apiClient.get(`/courses/${params?.courseId}`),
        apiClient.get('/categories'),
        apiClient.get('/admin/users?role=instructor&limit=100')
      ]);

      console.log('Course response:', courseRes);
      console.log('Categories response:', categoriesRes);
      console.log('Instructors response:', instructorsRes);

      const courseData = courseRes?.data || courseRes;
      if (!courseData) {
        toast.error('Course not found');
        router.push('/admin/courses');
        return;
      }

      setCourse(courseData as any);
      setFormData({
        ...courseData,
        category: (courseData as any).category?._id || '',
        instructor: (courseData as any).instructor?._id || ''
      });

      // Handle categories response - check multiple possible response structures
      let categoriesData = [];
      if ((categoriesRes as any)?.data?.categories) {
        categoriesData = (categoriesRes as any).data.categories;
      } else if ((categoriesRes as any)?.categories) {
        categoriesData = (categoriesRes as any).categories;
      } else if (Array.isArray((categoriesRes as any)?.data)) {
        categoriesData = (categoriesRes as any).data;
      } else if (Array.isArray(categoriesRes)) {
        categoriesData = categoriesRes as any;
      }

      setCategories(categoriesData);

      // Handle instructors response - check multiple possible response structures
      let instructorsData = [];
      if ((instructorsRes as any)?.data?.users) {
        instructorsData = (instructorsRes as any).data.users;
      } else if ((instructorsRes as any)?.users) {
        instructorsData = (instructorsRes as any).users;
      } else if (Array.isArray((instructorsRes as any)?.data)) {
        instructorsData = (instructorsRes as any).data;
      } else if (Array.isArray(instructorsRes)) {
        instructorsData = instructorsRes as any;
      }

      setInstructors(instructorsData);
    } catch (error: any) {
      console.error('Failed to fetch course data:', error);
      toast.error('Failed to load course data');
      router.push('/admin/courses');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor is required';
    if ((formData.price || 0) < 0) newErrors.price = 'Price must be non-negative';
    if ((formData.discountPrice || 0) < 0) newErrors.discountPrice = 'Discount price must be non-negative';
    if ((formData.discountPrice || 0) > (formData.price || 0)) {
      newErrors.discountPrice = 'Discount price cannot be higher than regular price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(`/courses/${params?.courseId}`, formData);
      
      toast.success('Course updated successfully');
      router.push('/admin/courses');
    } catch (error: any) {
      console.error('Failed to update course:', error);
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/courses/${params?.courseId}`);
      
      toast.success('Course deleted successfully');
      router.push('/admin/courses');
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index) || []
    }));
  };

  const addLearningPoint = () => {
    if (newLearningPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        whatYouWillLearn: [...(prev.whatYouWillLearn || []), newLearningPoint.trim()]
      }));
      setNewLearningPoint('');
    }
  };

  const removeLearningPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn?.filter((_, i) => i !== index) || []
    }));
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: (formData.lessons?.length || 0) + 1
    };
    setFormData(prev => ({
      ...prev,
      lessons: [...(prev.lessons || []), newLesson]
    }));
  };

  const updateLesson = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons?.map((lesson, i) => 
        i === index ? { ...lesson, [field]: value } : lesson
      ) || []
    }));
  };

  const removeLesson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons?.filter((_, i) => i !== index) || []
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: BookOpen },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/admin/courses')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/courses/${course._id}`)}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center px-4 py-2 text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Enrolled Students</div>
            <div className="text-2xl font-bold text-blue-600">{course.enrolledStudents || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Rating</div>
            <div className="text-2xl font-bold text-yellow-600">{course.rating?.toFixed(1) || '0.0'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Status</div>
            <div className={`text-sm font-medium capitalize ${
              course.status === 'published' ? 'text-green-600' :
              course.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {course.status}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency((course.enrolledStudents || 0) * (course.discountPrice || course.price || 0))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter course title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Short Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.shortDescription || ''}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the course"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor *
                  </label>
                  <select
                    value={formData.instructor || ''}
                    onChange={(e) => handleInputChange('instructor', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.instructor ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name} ({instructor.email})
                      </option>
                    ))}
                  </select>
                  {errors.instructor && (
                    <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={formData.level || 'beginner'}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language || 'english'}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="english">English</option>
                    <option value="vietnamese">Vietnamese</option>
                  </select>
                </div>

                {/* Thumbnail */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={formData.thumbnail || ''}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter thumbnail image URL"
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                  {formData.thumbnail && (
                    <div className="mt-3">
                      <img
                        src={formData.thumbnail}
                        alt="Course thumbnail preview"
                        className="w-32 h-20 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Tab - Similar to create form but with existing data */}
          {activeTab === 'content' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Detailed description of the course content, objectives, and structure"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a requirement"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.requirements || []).map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="flex-1">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You Will Learn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What You Will Learn
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newLearningPoint}
                    onChange={(e) => setNewLearningPoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningPoint())}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a learning outcome"
                  />
                  <button
                    type="button"
                    onClick={addLearningPoint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.whatYouWillLearn || []).map((point, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="flex-1">{point}</span>
                      <button
                        type="button"
                        onClick={() => removeLearningPoint(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Lessons
                  </label>
                  <button
                    type="button"
                    onClick={addLesson}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </button>
                </div>
                <div className="space-y-4">
                  {(formData.lessons || []).map((lesson, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Lesson {index + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, 'title', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Lesson title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={lesson.duration}
                            onChange={(e) => updateLesson(index, 'duration', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Duration in minutes"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Video URL
                          </label>
                          <input
                            type="url"
                            value={lesson.videoUrl}
                            onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Video URL (YouTube, Vimeo, etc.)"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={lesson.description}
                            onChange={(e) => updateLesson(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Lesson description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (VND) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter course price"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                  {formData.price && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(formData.price)}
                    </p>
                  )}
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => handleInputChange('discountPrice', parseFloat(e.target.value) || 0)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.discountPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter discount price (optional)"
                    min="0"
                  />
                  {errors.discountPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.discountPrice}</p>
                  )}
                  {formData.discountPrice && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(formData.discountPrice)}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Course duration in hours"
                    min="0"
                    step="0.5"
                  />
                </div>

                {/* Discount Percentage Display */}
                {formData.price && formData.discountPrice && formData.discountPrice < formData.price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage
                    </label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <span className="text-green-800 font-medium">
                        {Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)}% OFF
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Regular Price:</span>
                    <span>{formData.price ? formatCurrency(formData.price) : 'Not set'}</span>
                  </div>
                  {formData.discountPrice && (
                    <div className="flex justify-between">
                      <span>Discount Price:</span>
                      <span className="text-green-600">{formatCurrency(formData.discountPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Final Price:</span>
                    <span className="text-blue-600">
                      {formData.discountPrice || formData.price ?
                        formatCurrency((formData.discountPrice || formData.price) as number) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Status
                  </label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.status === 'draft' && 'Course is not visible to students'}
                    {formData.status === 'published' && 'Course is live and available for enrollment'}
                    {formData.status === 'archived' && 'Course is hidden but accessible to enrolled students'}
                  </p>
                </div>

                {/* Published State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publication
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublished || false}
                        onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                    <p className="text-sm text-gray-500">
                      Make this course visible in course listings
                    </p>
                  </div>
                </div>

                {/* Featured State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Course
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured || false}
                        onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
                    <p className="text-sm text-gray-500">
                      Show this course in featured sections
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Statistics */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Course Statistics</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Enrolled Students:</span>
                    <div className="font-medium">{course?.enrolledStudents || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Rating:</span>
                    <div className="font-medium">{course?.rating?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Lessons:</span>
                    <div className="font-medium">{formData.lessons?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">
                      {course?.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Course</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{course.title}"? This action cannot be undone.
                    {course.enrolledStudents > 0 && (
                      <span className="block mt-2 text-red-600 font-medium">
                        Warning: This course has {course.enrolledStudents} enrolled students.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EditCoursePage;
