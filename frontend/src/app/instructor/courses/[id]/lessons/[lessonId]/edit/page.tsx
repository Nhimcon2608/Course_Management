'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { lessonApi, Lesson, UpdateLessonData } from '@/services/lessonApi';
import { instructorDashboardApi } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';

const EditLessonPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<UpdateLessonData>({
    title: '',
    description: '',
    content: '',
    duration: 10,
    isPreview: false,
    isPublished: false,
    resources: []
  });

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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!authChecked || !isAuthenticated || user?.role !== 'instructor') return;

      try {
        setPageLoading(true);

        // Load course info
        const courseData = await instructorDashboardApi.getCourse(courseId);
        setCourse(courseData);

        // Load lesson data
        const lessonData = await lessonApi.getLesson(courseId, lessonId);
        setLesson(lessonData);

        // Set form data
        setFormData({
          title: lessonData.title,
          description: lessonData.description || '',
          content: lessonData.content || '',
          duration: lessonData.duration,
          isPreview: lessonData.isPreview,
          isPublished: lessonData.isPublished,
          resources: lessonData.resources || []
        });

      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error('Không thể tải dữ liệu');
        router.push(`/instructor/courses/${courseId}/lessons`);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [authChecked, isAuthenticated, user, courseId, lessonId, router]);

  const handleInputChange = (field: keyof UpdateLessonData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources?.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      ) || []
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [
        ...(prev.resources || []),
        { title: '', url: '', type: 'link' as const }
      ]
    }));
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push('Tiêu đề bài học là bắt buộc');
    } else if (formData.title.trim().length < 3) {
      errors.push('Tiêu đề bài học phải có ít nhất 3 ký tự');
    } else if (formData.title.trim().length > 200) {
      errors.push('Tiêu đề bài học không được vượt quá 200 ký tự');
    }

    if (formData.description && formData.description.length > 1000) {
      errors.push('Mô tả không được vượt quá 1000 ký tự');
    }

    if (!formData.duration || formData.duration < 1) {
      errors.push('Thời lượng phải ít nhất 1 phút');
    } else if (formData.duration > 600) {
      errors.push('Thời lượng không được vượt quá 600 phút (10 giờ)');
    }

    // Validate resources
    if (formData.resources) {
      for (const resource of formData.resources) {
        if (resource.title.trim() && !resource.url.trim()) {
          errors.push('URL tài liệu không được để trống khi có tiêu đề');
          break;
        }
        if (resource.url.trim() && !resource.title.trim()) {
          errors.push('Tiêu đề tài liệu không được để trống khi có URL');
          break;
        }
      }
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

      // Filter out empty resources
      const cleanedData = {
        ...formData,
        resources: formData.resources?.filter(resource => 
          resource.title.trim() && resource.url.trim()
        ) || []
      };

      await lessonApi.updateLesson(courseId, lessonId, cleanedData);
      
      toast.success('Cập nhật bài học thành công!');
      router.push(`/instructor/courses/${courseId}/lessons`);
    } catch (error: any) {
      console.error('Failed to update lesson:', error);
      
      if (error.response?.status === 400 && error.response?.data?.data) {
        const backendErrors = error.response.data.data;
        Object.values(backendErrors).forEach((err: any) => {
          if (err.message) {
            toast.error(err.message);
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Không thể cập nhật bài học');
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
            <span className="text-lg text-gray-600">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not instructor (will redirect)
  if (!isAuthenticated || user?.role !== 'instructor' || !course || !lesson) {
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
              onClick={() => router.push(`/instructor/courses/${courseId}/lessons`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài học</h1>
              <p className="mt-2 text-gray-600">
                Khóa học: {course.title}
              </p>
              <p className="text-sm text-gray-500">
                Bài học #{lesson.order}: {lesson.title}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
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
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề bài học *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        formData.title && formData.title.length > 0 && formData.title.length < 3 
                          ? 'border-red-300' 
                          : formData.title && formData.title.length > 200 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Nhập tiêu đề bài học (3-200 ký tự)"
                      required
                    />
                    <div className="mt-1 flex justify-between text-sm">
                      <span className={`${
                        formData.title && formData.title.length < 3 && formData.title.length > 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {formData.title && formData.title.length < 3 ? 'Tối thiểu 3 ký tự' : ''}
                      </span>
                      <span className={`${
                        formData.title && formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {formData.title?.length || 0}/200
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả bài học
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        formData.description && formData.description.length > 1000 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Mô tả ngắn gọn về nội dung bài học (tối đa 1000 ký tự)"
                    />
                    <div className="mt-1 text-right text-sm text-gray-500">
                      {formData.description?.length || 0}/1000
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời lượng ước tính (phút) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10"
                      min="1"
                      max="600"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Thời gian ước tính để học viên hoàn thành bài học này (1-600 phút)
                    </p>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="isPreview"
                        type="checkbox"
                        checked={formData.isPreview}
                        onChange={(e) => handleInputChange('isPreview', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPreview" className="ml-2 block text-sm text-gray-900">
                        Cho phép xem trước miễn phí
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isPublished"
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                        Xuất bản bài học
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Nội dung bài học</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nhập nội dung chi tiết của bài học..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Nội dung này sẽ hiển thị cho học viên. Video có thể được thêm riêng.
                  </p>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Tài liệu tham khảo</h2>
                <div className="space-y-4">
                  {formData.resources?.map((resource, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề
                          </label>
                          <input
                            type="text"
                            value={resource.title}
                            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Tên tài liệu"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={resource.url}
                            onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://..."
                          />
                        </div>
                        
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Loại
                            </label>
                            <select
                              value={resource.type}
                              onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="link">Link</option>
                              <option value="pdf">PDF</option>
                              <option value="doc">Document</option>
                              <option value="image">Hình ảnh</option>
                              <option value="other">Khác</option>
                            </select>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addResource}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tài liệu
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

export default EditLessonPage;
