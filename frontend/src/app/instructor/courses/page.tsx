'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  MoreVertical,
  BookOpen,
  Users,
  Star,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import { useAuth, useAuthActions } from '@/store/authStore';
import { instructorDashboardApi, InstructorCourse } from '@/services/instructorDashboardApi';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';

export default function InstructorCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Instructor Courses: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Instructor Courses: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Instructor Courses: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/courses');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Instructor Courses: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  // Load courses
  useEffect(() => {
    loadCourses();
  }, [statusFilter, sortBy]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await instructorDashboardApi.getCourses({
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50
      });

      // Response should be an array of courses
      setCourses(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load courses. Please check your connection and try again.';
      toast.error(errorMessage);
      setCourses([]); // Set empty array on error - no mock data
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCourses();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;
    
    try {
      await instructorDashboardApi.deleteCourse(courseId);
      toast.success('Đã xóa khóa học thành công');
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Không thể xóa khóa học');
    }
  };

  const handleTogglePublish = async (courseId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await instructorDashboardApi.unpublishCourse(courseId);
        toast.success('Đã ẩn khóa học');
      } else {
        await instructorDashboardApi.publishCourse(courseId);
        toast.success('Đã xuất bản khóa học');
      }
      loadCourses();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Không thể thay đổi trạng thái khóa học');
    }
  };

  const getStatusBadge = (course: InstructorCourse) => {
    if (course.isPublished) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã xuất bản
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'published') return matchesSearch && course.isPublished;
    if (statusFilter === 'draft') return matchesSearch && !course.isPublished;

    return matchesSearch;
  });

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa học</h1>
              <p className="mt-2 text-gray-600">
                Quản lý và theo dõi tất cả khóa học của bạn
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/instructor/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo khóa học mới
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Tên A-Z</option>
                <option value="students">Nhiều học viên nhất</option>
                <option value="revenue">Doanh thu cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'No courses match your current filters. Try adjusting your search criteria.'
                : 'You haven\'t created any courses yet. Start by creating your first course.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/instructor/courses/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Link>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={loadCourses}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Retry Loading
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Course Image */}
                <div className="relative h-48 bg-gray-200">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(course)}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.enrolledStudents || 0} học viên
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {course.rating?.toFixed(1) || '0.0'} ({course.reviewCount || 0})
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration || 0}h
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatPrice(course.price || 0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Link
                        href={`/instructor/courses/${course._id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Chỉnh sửa
                      </Link>
                      <Link
                        href={`/instructor/courses/${course._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Xem chi tiết
                      </Link>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTogglePublish(course._id, course.isPublished)}
                        className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded ${
                          course.isPublished
                            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                            : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                        }`}
                      >
                        {course.isPublished ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Ẩn
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Xuất bản
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
