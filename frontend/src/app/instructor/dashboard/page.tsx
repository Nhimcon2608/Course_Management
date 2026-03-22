'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  BarChart3, 
  Clock, 
  Award,
  Eye,
  Edit,
  Settings
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorStats, InstructorCourse } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

const InstructorDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Dashboard data state
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Instructor Dashboard: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Instructor Dashboard: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Instructor Dashboard: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/dashboard');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Instructor Dashboard: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }

      // Load dashboard data if user is instructor
      loadDashboardData();
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      
      // Load instructor stats and courses
      const [statsData, coursesData] = await Promise.all([
        instructorDashboardApi.getStats(),
        instructorDashboardApi.getCourses({ limit: 6 })
      ]);

      setStats(statsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load instructor dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your courses today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalCourses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.totalRevenue ? formatNumber(stats.totalRevenue) : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* My Courses */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
                  <button
                    onClick={() => router.push('/instructor/courses')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img
                            src={course.thumbnail || '/images/course-placeholder.jpg'}
                            alt={course.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600">
                              {course.enrolledStudents} students • ${course.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/instructor/courses/${course._id}`)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/instructor/courses/${course._id}/edit`)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No courses yet</p>
                    <button
                      onClick={() => router.push('/instructor/courses/create')}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/instructor/courses/create')}
                  className="w-full flex items-center px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Course
                </button>
                <button
                  onClick={() => router.push('/instructor/analytics')}
                  className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  View Analytics
                </button>
                <button
                  onClick={() => router.push('/instructor/students')}
                  className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Manage Students
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">New student enrolled in React Course</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">Course review received</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-sm text-gray-600">Payment received</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
