'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import {
  Search,
  Filter,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  Download,
  Eye,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorStudent, InstructorCourse } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';

const InstructorStudentsPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Students data state
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const studentsPerPage = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<InstructorStudent | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    email: '',
    courseId: ''
  });
  const [editForm, setEditForm] = useState({
    progress: 0,
    notes: ''
  });

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Instructor Students: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Instructor Students: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Instructor Students: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/students');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Instructor Students: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }

      // Load data if user is instructor
      loadData();
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  // Reload students when filters change
  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role === 'instructor') {
      loadStudents();
    }
  }, [searchTerm, selectedCourse, currentPage]);

  const loadData = async () => {
    try {
      setDataLoading(true);

      // Load courses first
      const coursesData = await instructorDashboardApi.getCourses({ limit: 100 });
      setCourses(Array.isArray(coursesData) ? coursesData : []);

      // Then load students
      await loadStudents();
    } catch (error: any) {
      console.error('Failed to load data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load initial data. Please check your connection and try again.';
      toast.error(errorMessage);
      setCourses([]); // No mock data fallback
    } finally {
      setDataLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await instructorDashboardApi.getStudents({
        limit: studentsPerPage,
        offset: (currentPage - 1) * studentsPerPage,
        courseId: selectedCourse === 'all' ? undefined : selectedCourse,
        search: searchTerm || undefined
      });

      setStudents(response.students || []);
      setTotalStudents(response.total || 0);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load students. Please check your connection and try again.';
      toast.error(errorMessage);
      setStudents([]); // No mock data fallback
      setTotalStudents(0);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressText = (progress: number) => {
    if (progress >= 80) return 'text-green-700';
    if (progress >= 50) return 'text-yellow-700';
    return 'text-red-700';
  };

  // CRUD Functions
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await instructorDashboardApi.addStudent(addForm);
      toast.success('Student added successfully');
      setShowAddModal(false);
      setAddForm({ email: '', courseId: '' });
      loadStudents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add student';
      toast.error(errorMessage);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await instructorDashboardApi.updateStudent(selectedStudent._id, editForm);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      setEditForm({ progress: 0, notes: '' });
      loadStudents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      toast.error(errorMessage);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await instructorDashboardApi.removeStudent(selectedStudent._id);
      toast.success('Student removed successfully');
      setShowDeleteModal(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove student';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (student: InstructorStudent) => {
    setSelectedStudent(student);
    setEditForm({
      progress: student.progress,
      notes: (student as any).notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student: InstructorStudent) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Export Functions
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExportLoading(true);

      // Get all students data for export (not just current page)
      const exportData = await instructorDashboardApi.getStudents({
        limit: 1000, // Get all students
        courseId: selectedCourse === 'all' ? undefined : selectedCourse,
        search: searchTerm || undefined
      });

      // Create CSV content
      if (format === 'csv') {
        const csvContent = generateCSV(exportData.students);
        downloadFile(csvContent, 'students-export.csv', 'text/csv');
      } else {
        // For Excel, we'll use the backend export API
        const courseId = selectedCourse === 'all' ? '' : selectedCourse;
        console.log('Requesting Excel export with params:', { courseId, format: 'excel', search: searchTerm });

        const blob = await instructorDashboardApi.exportStudentData(courseId, 'excel', searchTerm);
        console.log('Received blob for Excel export:', blob, 'Type:', typeof blob, 'Size:', blob?.size);

        if (!blob) {
          throw new Error('No data received from export API');
        }

        downloadBlob(blob, 'students-export.xlsx'); // Backend returns real Excel file
      }

      toast.success(`Students data exported successfully as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Export failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to export students data';
      toast.error(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const generateCSV = (students: InstructorStudent[]) => {
    const headers = [
      'Student Name',
      'Email',
      'Course',
      'Progress (%)',
      'Enrolled Date',
      'Last Activity',
      'Status'
    ];

    const rows = students.map(student => [
      student.student.name,
      student.student.email,
      student.course.title,
      student.progress.toString(),
      formatDate(student.enrolledAt),
      student.lastAccessedAt ? formatDate(student.lastAccessedAt) : 'Never',
      student.progress >= 100 ? 'Completed' : student.progress > 0 ? 'In Progress' : 'Not Started'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob: Blob | any, filename: string) => {
    // Ensure we have a proper Blob object
    let actualBlob: Blob;

    if (blob instanceof Blob) {
      actualBlob = blob;
    } else {
      // If it's not a Blob, try to convert it
      console.warn('Received non-Blob data, attempting to convert:', typeof blob);
      actualBlob = new Blob([blob], { type: 'application/octet-stream' });
    }

    try {
      const url = window.URL.createObjectURL(actualBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating download link:', error);
      throw new Error('Failed to download file');
    }
  };

  const totalPages = Math.ceil(totalStudents / studentsPerPage);

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Students</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your students' progress
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => router.push('/instructor/analytics')}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0 
                    ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.progress >= 100).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Course Filter */}
            <div className="sm:w-64">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        {students.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={student.student.avatar || '/images/default-avatar.png'}
                            alt={student.student.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.course.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getProgressText(student.progress)}`}>
                            {student.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.enrolledAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastAccessedAt ? formatDate(student.lastAccessedAt) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * studentsPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * studentsPerPage, totalStudents)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalStudents}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCourse !== 'all'
                ? 'No students match your current filters. Try adjusting your search criteria.'
                : 'You don\'t have any enrolled students yet. Students will appear here once they enroll in your courses.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={loadStudents}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Retry Loading Students
              </button>
              {courses.length === 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">No courses available to filter by.</p>
                  <button
                    onClick={loadData}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Reload All Data
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Student to Course</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Email
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="student@example.com"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <select
                    required
                    value={addForm.courseId}
                    onChange={(e) => setAddForm({ ...addForm, courseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Student Progress</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Student: <span className="font-medium">{selectedStudent.student.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Course: <span className="font-medium">{selectedStudent.course.title}</span>
                </p>
              </div>

              <form onSubmit={handleEditStudent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add notes about this student..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-600">Remove Student</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to remove this student from the course?
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Student:</span> {selectedStudent.student.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Course:</span> {selectedStudent.course.title}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Progress:</span> {selectedStudent.progress}%
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. The student's progress will be lost.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Remove Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Students Data</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={exportLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Choose the format to export your students data:
                </p>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Current filters:</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Course: {selectedCourse === 'all' ? 'All Courses' : courses.find(c => c._id === selectedCourse)?.title || 'Unknown'}
                    </p>
                    {searchTerm && (
                      <p className="text-sm text-gray-500">
                        Search: "{searchTerm}"
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Total students: {totalStudents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </div>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </div>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudentsPage;
