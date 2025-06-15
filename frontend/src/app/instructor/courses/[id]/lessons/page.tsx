'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  Play,
  Upload,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { lessonApi, Lesson } from '@/services/lessonApi';
import { instructorDashboardApi } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const LessonsManagementPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        setLoading(true);

        // Load course info
        const courseData = await instructorDashboardApi.getCourse(courseId);
        setCourse(courseData);

        // Load lessons
        const lessonsData = await lessonApi.getLessons(courseId);
        setLessons(lessonsData.lessons);

      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error('Không thể tải dữ liệu');
        router.push('/instructor/courses');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authChecked, isAuthenticated, user, courseId, router]);

  const handleTogglePublish = async (lessonId: string, isPublished: boolean) => {
    try {
      setActionLoading(lessonId);
      
      await lessonApi.updateLesson(courseId, lessonId, { isPublished: !isPublished });
      
      setLessons(prev => prev.map(lesson => 
        lesson._id === lessonId 
          ? { ...lesson, isPublished: !isPublished }
          : lesson
      ));

      toast.success(isPublished ? 'Đã ẩn bài học' : 'Đã xuất bản bài học');
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error('Không thể thay đổi trạng thái bài học');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lessonTitle}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setActionLoading(lessonId);
      
      await lessonApi.deleteLesson(courseId, lessonId);
      
      setLessons(prev => prev.filter(lesson => lesson._id !== lessonId));
      
      toast.success('Đã xóa bài học thành công');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Không thể xóa bài học');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="text-lg text-gray-600">Đang tải dữ liệu...</span>
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
              onClick={() => router.push(`/instructor/courses/${courseId}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại khóa học
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Bài học</h1>
              <p className="text-gray-600 mb-4">{course.title}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {lessons.length} bài học
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {lessons.filter(l => l.isPublished).length} đã xuất bản
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(lessons.reduce((sum, l) => sum + l.duration, 0))} tổng thời lượng
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0">
              <Link
                href={`/instructor/courses/${courseId}/lessons/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo bài học mới
              </Link>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bài học nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng cách tạo bài học đầu tiên cho khóa học của bạn.
              </p>
              <div className="mt-6">
                <Link
                  href={`/instructor/courses/${courseId}/lessons/create`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo bài học đầu tiên
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {lessons.map((lesson, index) => (
                <div key={lesson._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Drag Handle */}
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Order Number */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                          {lesson.order}
                        </span>
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {lesson.title}
                          </h3>
                          
                          {/* Status Badges */}
                          <div className="flex items-center space-x-2">
                            {lesson.isPublished ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Đã xuất bản
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Bản nháp
                              </span>
                            )}
                            
                            {lesson.isPreview && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </span>
                            )}
                          </div>
                        </div>

                        {lesson.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}

                        {/* Lesson Stats */}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(lesson.duration)}
                          </div>
                          
                          {lesson.videoUrl && (
                            <div className="flex items-center">
                              <Video className="w-4 h-4 mr-1" />
                              {lesson.videoSize ? formatFileSize(lesson.videoSize) : 'Video'}
                            </div>
                          )}
                          
                          {lesson.assignmentCount > 0 && (
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {lesson.assignmentCount} bài tập
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Video Upload */}
                      <Link
                        href={`/instructor/courses/${courseId}/lessons/${lesson._id}/video`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {lesson.videoUrl ? (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Video
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </>
                        )}
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/instructor/courses/${courseId}/lessons/${lesson._id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>

                      {/* Assignments */}
                      <Link
                        href={`/instructor/courses/${courseId}/lessons/${lesson._id}/assignments`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Bài tập
                      </Link>

                      {/* Publish/Unpublish */}
                      <button
                        onClick={() => handleTogglePublish(lesson._id, lesson.isPublished)}
                        disabled={actionLoading === lesson._id}
                        className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded ${
                          lesson.isPublished
                            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                            : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === lesson._id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : lesson.isPublished ? (
                          <EyeOff className="w-3 h-3 mr-1" />
                        ) : (
                          <Eye className="w-3 h-3 mr-1" />
                        )}
                        {lesson.isPublished ? 'Ẩn' : 'Xuất bản'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                        disabled={actionLoading === lesson._id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonsManagementPage;
