'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Clock,
  Users,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAuth, useAuthActions } from '@/store/authStore';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import AssignmentForm from '@/components/instructor/AssignmentForm';
import { lessonApi, Assignment, CreateAssignmentData } from '@/services/lessonApi';
import { toast } from 'react-hot-toast';

interface Course {
  _id: string;
  title: string;
  slug: string;
}

interface Lesson {
  _id: string;
  title: string;
  course: string;
}

const AssignmentManagementPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        await initializeAuth();
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, initializeAuth]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authChecked, isAuthenticated, router]);

  // Redirect if not instructor
  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role !== 'instructor') {
      router.push('/dashboard');
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Fetch data
  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role === 'instructor' && courseId && lessonId) {
      fetchData();
    }
  }, [authChecked, isAuthenticated, user, courseId, lessonId]);

  const fetchData = async () => {
    try {
      setPageLoading(true);

      // Fetch course, lesson, and assignments data
      const [courseRes, lessonRes, assignmentsRes] = await Promise.allSettled([
        fetch(`/api/instructor/courses/${courseId}`),
        fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}`),
        lessonApi.getAssignments(courseId, lessonId)
      ]);

      // Handle course data
      if (courseRes.status === 'fulfilled' && courseRes.value.ok) {
        const courseData = await courseRes.value.json();
        setCourse(courseData.data || courseData);
      }

      // Handle lesson data
      if (lessonRes.status === 'fulfilled' && lessonRes.value.ok) {
        const lessonData = await lessonRes.value.json();
        setLesson(lessonData.data || lessonData);
      }

      // Handle assignments data
      if (assignmentsRes.status === 'fulfilled') {
        setAssignments(assignmentsRes.value.assignments || []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${assignmentTitle}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setActionLoading(assignmentId);
      
      await lessonApi.deleteAssignment(courseId, assignmentId);
      
      setAssignments(prev => prev.filter(assignment => assignment._id !== assignmentId));
      
      toast.success('Đã xóa bài tập thành công');
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error('Không thể xóa bài tập');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAssignment = async (data: CreateAssignmentData) => {
    try {
      setFormLoading(true);

      const newAssignment = await lessonApi.createAssignment(courseId, lessonId, data);

      setAssignments(prev => [newAssignment, ...prev]);
      setShowCreateForm(false);

      toast.success('Đã tạo bài tập thành công');
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error('Không thể tạo bài tập');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAssignment = async (data: CreateAssignmentData) => {
    if (!editingAssignment) return;

    try {
      setFormLoading(true);

      const updatedAssignment = await lessonApi.updateAssignment(courseId, editingAssignment._id, data);

      setAssignments(prev => prev.map(assignment =>
        assignment._id === editingAssignment._id ? updatedAssignment : assignment
      ));
      setEditingAssignment(null);

      toast.success('Đã cập nhật bài tập thành công');
    } catch (error) {
      console.error('Failed to update assignment:', error);
      toast.error('Không thể cập nhật bài tập');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      setActionLoading(assignment._id);

      const duplicatedData = {
        ...assignment,
        title: `${assignment.title} (Copy)`,
        isPublished: false
      };

      // Remove fields that shouldn't be copied
      delete (duplicatedData as any)._id;
      delete (duplicatedData as any).createdAt;
      delete (duplicatedData as any).updatedAt;
      delete (duplicatedData as any).submissions;
      delete (duplicatedData as any).submissionCount;
      delete (duplicatedData as any).averageScore;

      const newAssignment = await lessonApi.createAssignment(courseId, lessonId, duplicatedData);

      setAssignments(prev => [newAssignment, ...prev]);

      toast.success('Đã sao chép bài tập thành công');
    } catch (error) {
      console.error('Failed to duplicate assignment:', error);
      toast.error('Không thể sao chép bài tập');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.isPublished) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã xuất bản
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Bản nháp
        </span>
      );
    }
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'instructor') {
    return null;
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/instructor/courses" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                Khóa học
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href={`/instructor/courses/${courseId}`} className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                  {course?.title || 'Khóa học'}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href={`/instructor/courses/${courseId}/lessons`} className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                  Bài học
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {lesson?.title || 'Bài học'}
                </span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Bài tập</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href={`/instructor/courses/${courseId}/lessons/${lessonId}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại bài học
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý bài tập</h1>
              <p className="mt-2 text-gray-600">
                Bài học: <span className="font-medium">{lesson?.title}</span>
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo bài tập mới
            </button>
          </div>
        </div>

        {/* Assignment List */}
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bài tập nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo bài tập đầu tiên cho bài học này.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo bài tập mới
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {assignment.description || 'Không có mô tả'}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(assignment)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="w-4 h-4 mr-2" />
                      {assignment.questions?.length || 0} câu hỏi
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Award className="w-4 h-4 mr-2" />
                      {assignment.totalPoints} điểm
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      {assignment.submissionCount || 0} bài nộp
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {assignment.averageScore || 0}% TB
                    </div>
                  </div>

                  {assignment.deadline && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      Hạn nộp: {formatDate(assignment.deadline)}
                    </div>
                  )}

                  {assignment.timeLimit && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4 mr-2" />
                      Thời gian: {assignment.timeLimit} phút
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDuplicateAssignment(assignment)}
                        disabled={actionLoading === assignment._id}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Sao chép
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Xem bài nộp
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment._id, assignment.title)}
                        disabled={actionLoading === assignment._id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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

        {/* Assignment Form Modal */}
        <AssignmentForm
          isOpen={showCreateForm || !!editingAssignment}
          onClose={() => {
            setShowCreateForm(false);
            setEditingAssignment(null);
          }}
          onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
          initialData={editingAssignment || undefined}
          isLoading={formLoading}
        />
      </div>
    </div>
  );
};

export default AssignmentManagementPage;
