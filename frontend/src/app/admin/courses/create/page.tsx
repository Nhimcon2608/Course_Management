'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Settings
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
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
}

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  price: number;
  discountPrice: number;
  thumbnail: string;
  instructor: string;
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
}

const CreateCoursePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    price: 0,
    discountPrice: 0,
    thumbnail: '',
    instructor: '',
    status: 'draft',
    level: 'beginner',
    language: 'english',
    duration: 0,
    tags: [],
    requirements: [],
    whatYouWillLearn: [],
    lessons: [],
    isPublished: false,
    isFeatured: false
  });

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

    fetchInitialData();
  }, [isAuthenticated, user, router]);

  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data...');

      const [categoriesRes, instructorsRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/admin/users?role=instructor&limit=100')
      ]);

      console.log('Categories response:', categoriesRes);
      console.log('Instructors response:', instructorsRes);

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
      console.log('Categories set:', categoriesData);

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
      console.log('Instructors set:', instructorsData);

      if (categoriesData.length === 0) {
        toast.error('No categories found. Please create categories first.');
      }
      if (instructorsData.length === 0) {
        toast.error('No instructors found. Please create instructor accounts first.');
      }
    } catch (error: any) {
      console.error('Failed to fetch initial data:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load form data: ${error.response?.data?.message || error.message}`);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Basic required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor is required';

    // Description validation (minimum 50 characters)
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    // Short description validation (minimum 20 characters)
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.trim().length < 20) {
      newErrors.shortDescription = 'Short description must be at least 20 characters';
    }

    // Thumbnail validation (required)
    if (!formData.thumbnail.trim()) {
      newErrors.thumbnail = 'Thumbnail URL is required';
    }

    // Price validation
    if (formData.price < 0) newErrors.price = 'Price must be non-negative';
    if (formData.discountPrice < 0) newErrors.discountPrice = 'Discount price must be non-negative';
    if (formData.discountPrice > formData.price) newErrors.discountPrice = 'Discount price cannot be higher than regular price';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('Form validation failed. Errors:', errors);
      toast.error('Please fix the form errors');

      // Show specific error messages
      const errorMessages = Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
      console.log('Specific errors:', errorMessages);

      return;
    }

    try {
      setLoading(true);

      console.log('Submitting course data:', formData);
      console.log('User authentication:', user);

      // Check if user is authenticated and is admin
      if (!user || user.role !== 'admin') {
        toast.error('Admin authentication required');
        router.push('/auth/login');
        return;
      }

      const response = await apiClient.post('/courses', formData);

      console.log('Course creation response:', response);
      toast.success('Course created successfully');
      router.push('/admin/courses');
    } catch (error: any) {
      console.error('Failed to create course:', error);
      console.error('Error response:', error.response);

      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
        router.push('/auth/login');
      } else if (error.response?.status === 403) {
        toast.error('Admin privileges required');
      } else if (error.response?.status === 405) {
        toast.error('Course creation endpoint not available. Please contact support.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create course');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  // Helper function to populate form with sample data
  const fillSampleData = () => {
    setFormData({
      title: 'Complete Web Development Course',
      description: 'This comprehensive web development course covers everything you need to know to become a professional web developer. You will learn HTML5, CSS3, JavaScript ES6+, React, Node.js, and modern development tools. The course includes hands-on projects, real-world examples, and industry best practices that will prepare you for a successful career in web development.',
      shortDescription: 'Learn modern web development from scratch with HTML, CSS, JavaScript, React, and Node.js through hands-on projects and real-world examples.',
      category: categories.length > 0 ? categories[0]._id : '',
      instructor: instructors.length > 0 ? instructors[0]._id : '',
      price: 500000,
      discountPrice: 400000,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center',
      level: 'beginner',
      language: 'english',
      duration: 40,
      tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Web Development'],
      requirements: ['Basic computer skills', 'Internet connection', 'Willingness to learn'],
      whatYouWillLearn: [
        'Build responsive websites with HTML5 and CSS3',
        'Master JavaScript fundamentals and ES6+ features',
        'Create interactive web applications with React',
        'Understand modern web development workflow'
      ],
      lessons: [
        {
          title: 'Introduction to Web Development',
          description: 'Overview of web development technologies and tools',
          videoUrl: 'https://youtu.be/IuYNIvXs_qE?si=DLvOprGb5SgYix6Y',
          duration: 30,
          order: 1
        },
        {
          title: 'HTML5 Fundamentals',
          description: 'Learn the structure and semantics of HTML5',
          videoUrl: 'https://youtu.be/IuYNIvXs_qE?si=DLvOprGb5SgYix6Y',
          duration: 45,
          order: 2
        }
      ],
      status: 'published',
      isPublished: true,
      isFeatured: false
    });

    // Clear any existing errors
    setErrors({});

    toast.success('Sample data filled! You can now submit the form.');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addLearningPoint = () => {
    if (newLearningPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, newLearningPoint.trim()]
      }));
      setNewLearningPoint('');
    }
  };

  const removeLearningPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index)
    }));
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: formData.lessons.length + 1
    };
    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));
  };

  const updateLesson = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => 
        i === index ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const removeLesson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }));
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
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600">Add a new course to the platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={fillSampleData}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fill Sample Data
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/courses')}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Course'}
            </button>
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
          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field}>
                          <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> {message as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.title.length}/5 minimum, 200 maximum)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter course title (minimum 5 characters)"
                    maxLength={200}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a clear, descriptive title for your course
                  </p>
                </div>

                {/* Short Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.shortDescription.length}/20 minimum)
                    </span>
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={3}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shortDescription ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description of the course (minimum 20 characters)"
                  />
                  {errors.shortDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a concise overview that will appear in course listings
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
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
                    value={formData.instructor}
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
                    value={formData.level}
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
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Thumbnail */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      className={`flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.thumbnail ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter thumbnail image URL (required)"
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.thumbnail && (
                    <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a high-quality image URL for the course thumbnail (recommended: 400x300px)
                  </p>
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

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description *
                  <span className="text-xs text-gray-500 ml-2">
                    ({formData.description.length}/50 minimum)
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Detailed description of the course content, objectives, and structure (minimum 50 characters)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Provide a comprehensive description that explains what students will learn and how the course is structured
                </p>
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
                  {formData.tags.map((tag, index) => (
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
                  Course Requirements
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {formData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What You Will Learn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What Students Will Learn
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
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {formData.whatYouWillLearn.map((point, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm">{point}</span>
                      <button
                        type="button"
                        onClick={() => removeLearningPoint(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lessons */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Course Lessons
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
                  {formData.lessons.map((lesson, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">
                            Lesson {index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Lesson Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, 'title', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter lesson title"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={lesson.duration}
                            onChange={(e) => updateLesson(index, 'duration', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Video URL
                          </label>
                          <input
                            type="url"
                            value={lesson.videoUrl}
                            onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter video URL"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <textarea
                            value={lesson.description}
                            onChange={(e) => updateLesson(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Lesson description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.lessons.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No lessons added yet</p>
                      <p className="text-sm">Click "Add Lesson" to create your first lesson</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Regular Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regular Price (VND) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price (VND)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.discountPrice}
                      onChange={(e) => handleInputChange('discountPrice', parseFloat(e.target.value) || 0)}
                      className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.discountPrice ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                  {errors.discountPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.discountPrice}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty or 0 for no discount
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Estimated total course duration
                  </p>
                </div>

                {/* Pricing Preview */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Preview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Regular Price:</span>
                      <span className="text-sm font-medium">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(formData.price)}
                      </span>
                    </div>
                    {formData.discountPrice > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Discount Price:</span>
                          <span className="text-sm font-medium text-green-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(formData.discountPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">You Save:</span>
                          <span className="text-sm font-medium text-red-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(formData.price - formData.discountPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Discount:</span>
                          <span className="text-sm font-medium text-orange-600">
                            {Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)}% OFF
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Draft courses are not visible to students
                  </p>
                </div>

                {/* Course Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.level}
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
                    Course Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Settings Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Published
                      </label>
                      <p className="text-xs text-gray-500">
                        Make course visible to students
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Featured Course
                      </label>
                      <p className="text-xs text-gray-500">
                        Show in featured courses section
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Course Summary */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Course Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Status:</span>
                    <p className="text-blue-800 capitalize">{formData.status}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Level:</span>
                    <p className="text-blue-800 capitalize">{formData.level}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Lessons:</span>
                    <p className="text-blue-800">{formData.lessons.length}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Duration:</span>
                    <p className="text-blue-800">{formData.duration}h</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateCoursePage;
