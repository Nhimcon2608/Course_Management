'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  CheckCircle,
  Loader2
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorCourse, UpdateCourseData } from '@/services/instructorDashboardApi';
import { categoryApi } from '@/services/api';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateCourseData>({
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
    thumbnail: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        await initializeAuth();
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, initializeAuth]);

  // Redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && (!isAuthenticated || user?.role !== 'instructor')) {
      router.push('/auth/login');
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Load course data and categories
  useEffect(() => {
    const loadData = async () => {
      if (!authChecked || !isAuthenticated || user?.role !== 'instructor') return;

      try {
        setPageLoading(true);

        // Load course data
        const course = await instructorDashboardApi.getCourse(courseId);
        
        // Populate form with course data
        setFormData({
          title: course.title || '',
          description: course.description || '',
          shortDescription: course.shortDescription || '',
          price: course.price || 0,
          originalPrice: course.originalPrice || 0,
          category: course.category?._id || '',
          level: course.level || 'beginner',
          duration: course.duration || 0,
          requirements: course.requirements?.length ? course.requirements : [''],
          whatYouWillLearn: course.whatYouWillLearn?.length ? course.whatYouWillLearn : [''],
          tags: course.tags?.length ? course.tags : [''],
          thumbnail: course.thumbnail || ''
        });

        // Load categories
        const categoriesResponse = await categoryApi.getCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.categories || []);
        }

      } catch (error: any) {
        console.error('Failed to load course data:', error);
        toast.error('Không thể tải dữ liệu khóa học');
        router.push('/instructor/courses');
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [authChecked, isAuthenticated, user, courseId, router]);

  const handleInputChange = (field: keyof UpdateCourseData, value: any) => {
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
      errors.push('Tiêu đề khóa học là bắt buộc');
    } else if (formData.title.trim().length < 5) {
      errors.push('Tiêu đề khóa học phải có ít nhất 5 ký tự');
    } else if (formData.title.trim().length > 200) {
      errors.push('Tiêu đề khóa học không được vượt quá 200 ký tự');
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.push('Mô tả khóa học là bắt buộc');
    } else if (formData.description.trim().length < 50) {
      errors.push('Mô tả khóa học phải có ít nhất 50 ký tự');
    }

    // Short description validation
    if (!formData.shortDescription.trim()) {
      errors.push('Mô tả ngắn là bắt buộc');
    } else if (formData.shortDescription.trim().length < 20) {
      errors.push('Mô tả ngắn phải có ít nhất 20 ký tự');
    } else if (formData.shortDescription.trim().length > 500) {
      errors.push('Mô tả ngắn không được vượt quá 500 ký tự');
    }

    // Category validation
    if (!formData.category) {
      errors.push('Vui lòng chọn danh mục');
    }

    // Price validation
    if (formData.price <= 0) {
      errors.push('Giá phải lớn hơn 0');
    }

    // Duration validation
    if (formData.duration < 0.5) {
      errors.push('Thời lượng phải ít nhất 0.5 giờ');
    }

    // Thumbnail validation
    if (!formData.thumbnail || !formData.thumbnail.trim()) {
      errors.push('Ảnh thumbnail là bắt buộc');
    }

    // What you will learn validation
    const learningOutcomes = formData.whatYouWillLearn?.filter(item => item.trim()) || [];
    if (learningOutcomes.length === 0) {
      errors.push('Ít nhất một mục tiêu học tập là bắt buộc');
    }

    return errors;
  };

  const handleSubmit = async () => {
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

      await instructorDashboardApi.updateCourse(courseId, cleanedData);
      
      toast.success('Cập nhật khóa học thành công!');
      router.push('/instructor/courses');
    } catch (error: any) {
      console.error('Failed to update course:', error);
      
      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data?.data) {
        const backendErrors = error.response.data.data;
        Object.values(backendErrors).forEach((err: any) => {
          if (err.message) {
            toast.error(err.message);
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Không thể cập nhật khóa học');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="text-lg text-gray-600">Đang tải dữ liệu khóa học...</span>
          </div>
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
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
              <p className="mt-2 text-gray-600">
                Cập nhật thông tin khóa học của bạn
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => window.open(`/courses/${courseId}`, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin cơ bản</h2>
                <div className="space-y-6">
                  {/* Course Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề khóa học *
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
                      placeholder="Nhập tiêu đề khóa học (5-200 ký tự)"
                      required
                    />
                    <div className="mt-1 flex justify-between text-sm">
                      <span className={`${
                        formData.title.length < 5 && formData.title.length > 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {formData.title.length < 5 ? 'Tối thiểu 5 ký tự' : ''}
                      </span>
                      <span className={`${
                        formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {formData.title.length}/200
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả ngắn *
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
                      placeholder="Mô tả ngắn gọn về khóa học (20-500 ký tự)"
                      required
                    />
                    <div className="mt-1 flex justify-between text-sm">
                      <span className={`${
                        formData.shortDescription.length < 20 && formData.shortDescription.length > 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {formData.shortDescription.length < 20 ? 'Tối thiểu 20 ký tự' : ''}
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
                      Mô tả chi tiết *
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
                      placeholder="Mô tả chi tiết về khóa học (tối thiểu 50 ký tự)"
                      required
                    />
                    <div className="mt-1 flex justify-between text-sm">
                      <span className={`${
                        formData.description.length < 50 && formData.description.length > 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {formData.description.length < 50 ? 'Tối thiểu 50 ký tự' : ''}
                      </span>
                      <span className="text-gray-500">
                        {formData.description.length} ký tự
                      </span>
                    </div>
                  </div>

                  {/* Price and Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá ($) *
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
                        Giá gốc ($)
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
                        Thời lượng (giờ) *
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

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấp độ
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="beginner">Người mới bắt đầu</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Nâng cao</option>
                    </select>
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Thumbnail *
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
                      Nhập URL cho ảnh thumbnail khóa học. Kích thước khuyến nghị: 1280x720px. 
                      Bạn có thể sử dụng placeholder mặc định hoặc upload ảnh lên dịch vụ như Imgur, Cloudinary.
                    </p>
                  </div>
                </div>
              </div>

              {/* What You Will Learn */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Bạn sẽ học được gì</h2>
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
                          placeholder="Học viên sẽ học được gì? (tối đa 300 ký tự)"
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
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm mục tiêu học tập
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Yêu cầu</h2>
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
                          placeholder="Học viên cần biết gì? (tối đa 200 ký tự)"
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
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm yêu cầu
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags</h2>
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
                          placeholder="Thêm tag (tối đa 50 ký tự)"
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
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCoursePage;
