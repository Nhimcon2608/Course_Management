'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import {
  ArrowLeft,
  Edit,
  Eye,
  Users,
  Star,
  DollarSign,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorCourse } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const [course, setCourse] = useState<InstructorCourse | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (!authChecked || !isAuthenticated || user?.role !== 'instructor') return;

      try {
        setLoading(true);
        const courseData = await instructorDashboardApi.getCourse(courseId);
        setCourse(courseData);
      } catch (error: any) {
        console.error('Failed to load course:', error);
        toast.error('Không thể tải thông tin khóa học');
        router.push('/instructor/courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [authChecked, isAuthenticated, user, courseId, router]);

  const handleTogglePublish = async () => {
    if (!course) return;

    try {
      if (course.isPublished) {
        await instructorDashboardApi.unpublishCourse(course._id);
        setCourse(prev => prev ? { ...prev, isPublished: false } : null);
        toast.success('Đã ẩn khóa học');
      } else {
        await instructorDashboardApi.publishCourse(course._id);
        setCourse(prev => prev ? { ...prev, isPublished: true } : null);
        toast.success('Đã xuất bản khóa học');
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Không thể thay đổi trạng thái khóa học');
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.')) return;
    
    try {
      await instructorDashboardApi.deleteCourse(course._id);
      toast.success('Đã xóa khóa học thành công');
      router.push('/instructor/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Không thể xóa khóa học');
    }
  };

  const getStatusBadge = (course: InstructorCourse) => {
    if (course.isPublished) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Đã xuất bản
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Bản nháp
        </span>
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="text-lg text-gray-600">Đang tải thông tin khóa học...</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not instructor (will redirect)
  if (!isAuthenticated || user?.role !== 'instructor' || !course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/instructor/courses')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                {getStatusBadge(course)}
              </div>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Tạo ngày {formatDate(course.createdAt)}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.category?.name}
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                href={`/instructor/courses/${course._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Link>
              
              <button
                onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </button>
              
              <button
                onClick={handleTogglePublish}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  course.isPublished
                    ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                }`}
              >
                {course.isPublished ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Ẩn khóa học
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Xuất bản
                  </>
                )}
              </button>
              
              <button
                onClick={handleDeleteCourse}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                Xóa khóa học
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Image */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả khóa học</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
              </div>
            </div>

            {/* What You'll Learn */}
            {(course as any).whatYouWillLearn && (course as any).whatYouWillLearn.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bạn sẽ học được gì</h2>
                <ul className="space-y-2">
                  {(course as any).whatYouWillLearn.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {(course as any).requirements && (course as any).requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Yêu cầu</h2>
                <ul className="space-y-2">
                  {(course as any).requirements.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {(course as any).tags && (course as any).tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {(course as any).tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê khóa học</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Học viên</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {course.enrolledStudents || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Đánh giá</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {course.rating?.toFixed(1) || '0.0'} ({course.reviewCount || 0})
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Thời lượng</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {course.duration || 0} giờ
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Giá</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(course.price || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Cấp độ</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {course.level === 'beginner' ? 'Người mới' : 
                     course.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
              <div className="space-y-3">
                <Link
                  href={`/instructor/courses/${course._id}/lessons`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Quản lý bài học
                </Link>

                <Link
                  href={`/instructor/students?courseId=${course._id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Xem học viên
                </Link>

                <Link
                  href={`/instructor/analytics?courseId=${course._id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Xem thống kê
                </Link>
              </div>
            </div>

            {/* Course Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khóa học</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="ml-2 text-gray-900">{formatDate(course.createdAt)}</span>
                </div>
                
                <div>
                  <span className="text-gray-600">Cập nhật lần cuối:</span>
                  <span className="ml-2 text-gray-900">{formatDate(course.updatedAt)}</span>
                </div>
                
                <div>
                  <span className="text-gray-600">ID khóa học:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">{course._id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
