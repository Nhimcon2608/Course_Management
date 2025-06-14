'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi, AdminCourse, PaginationResponse } from '@/services/adminApi';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Star,
  Users,
  DollarSign,
  Calendar,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminCoursesPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse<AdminCourse>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    instructor: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<{ course: AdminCourse; status: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdminCourse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

    fetchCourses();
  }, [isAuthenticated, user, router, currentPage, searchTerm, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCourses({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        ...filters
      });
      setCourses(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (courseId: string, status: 'draft' | 'published' | 'archived', reason?: string) => {
    try {
      await adminApi.updateCourseStatus(courseId, status, reason);
      toast.success(`Course ${status} successfully`);
      fetchCourses();
      setShowStatusModal(null);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to update course status:', error);
      toast.error('Failed to update course status');
    }
  };

  const handleFeaturedToggle = async (courseId: string) => {
    try {
      await adminApi.toggleCourseFeatured(courseId);
      toast.success('Course featured status updated');
      fetchCourses();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to update featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteCourse = async (course: AdminCourse) => {
    try {
      setDeleteLoading(true);

      // Force delete if course has enrolled students (admin privilege)
      const forceDelete = course.stats.totalEnrollments > 0;

      await adminApi.deleteCourse(course._id, forceDelete);

      toast.success(`Course "${course.title}" deleted successfully`);
      setShowDeleteModal(null);
      setShowActionMenu(null);
      fetchCourses(); // Refresh the courses list
    } catch (error: any) {
      console.error('Failed to delete course:', error);

      // Handle specific error messages
      const errorMessage = error.response?.data?.message || 'Failed to delete course';

      if (errorMessage.includes('enrolled students')) {
        toast.error('Cannot delete course with enrolled students. Please contact system administrator.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage courses, approvals, and content</p>
          </div>
          <button
            onClick={() => router.push('/admin/courses/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
                <option value="price">Price</option>
                <option value="enrolledStudents">Enrollments</option>
              </select>

              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading courses...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statistics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                              alt={course.title}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {course.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(course.price)}
                              </div>
                              <div className="flex items-center mt-1">
                                {course.featured && (
                                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                )}
                                <span className="text-xs text-gray-500 capitalize">
                                  {course.level}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {course.instructor?.name || 'No Instructor'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.instructor?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(course.status)}`}>
                              {course.status}
                            </span>
                            {course.category && (
                              <span className="text-xs text-gray-500">
                                {course.category.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 text-gray-400 mr-1" />
                              {course.stats.totalEnrollments} enrollments
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                              {formatCurrency(course.stats.totalRevenue)}
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-gray-400 mr-1" />
                              {course.rating.toFixed(1)} rating
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(course.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === course._id ? null : course._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {showActionMenu === course._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                <div className="py-1">
                                  <button
                                    onClick={() => router.push(`/courses/${course._id}`)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Course
                                  </button>
                                  <button
                                    onClick={() => router.push(`/admin/courses/${course._id}/edit`)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Course
                                  </button>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => setShowStatusModal({ course, status: 'published' })}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    disabled={course.status === 'published'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Publish Course
                                  </button>
                                  <button
                                    onClick={() => setShowStatusModal({ course, status: 'archived' })}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    disabled={course.status === 'archived'}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Archive Course
                                  </button>
                                  <button
                                    onClick={() => handleFeaturedToggle(course._id)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Star className="h-4 w-4 mr-2" />
                                    {course.featured ? 'Unfeature' : 'Feature'} Course
                                  </button>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => {
                                      setShowDeleteModal(course);
                                      setShowActionMenu(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Course
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * pagination.itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {showStatusModal.status === 'published' ? 'Publish' : 'Archive'} Course
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to {showStatusModal.status} "{showStatusModal.course.title}"?
                </p>
                <textarea
                  placeholder="Optional reason for status change..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  id="statusReason"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowStatusModal(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reason = (document.getElementById('statusReason') as HTMLTextAreaElement)?.value;
                      handleStatusUpdate(showStatusModal.course._id, showStatusModal.status as any, reason);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                  Delete Course
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  <p className="mb-2">
                    Are you sure you want to delete <strong>"{showDeleteModal.title}"</strong>?
                  </p>

                  {showDeleteModal.stats.totalEnrollments > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">
                            Warning: Course has enrolled students
                          </h4>
                          <div className="mt-1 text-sm text-red-700">
                            <p>This course has <strong>{showDeleteModal.stats.totalEnrollments} enrolled students</strong>.</p>
                            <p className="mt-1">Deleting this course will:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Remove all course content permanently</li>
                              <li>Cancel all student enrollments</li>
                              <li>Remove student progress data</li>
                              <li>This action cannot be undone</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Course Details:</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <span>{showDeleteModal.instructor?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enrollments:</span>
                        <span>{showDeleteModal.stats.totalEnrollments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span>{formatCurrency(showDeleteModal.stats.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="capitalize">{showDeleteModal.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    disabled={deleteLoading}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(showDeleteModal)}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Course
                      </>
                    )}
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

export default AdminCoursesPage;
