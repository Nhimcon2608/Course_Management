'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Award
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorAnalytics } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';

const InstructorAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Analytics data state
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Instructor Analytics: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Instructor Analytics: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Instructor Analytics: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/analytics');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Instructor Analytics: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }

      // Load analytics data if user is instructor
      loadAnalytics();
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  // Reload analytics when period changes
  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role === 'instructor') {
      loadAnalytics();
    }
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setDataLoading(true);
      const analyticsData = await instructorDashboardApi.getAnalytics(selectedPeriod);
      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load analytics data. Please check your connection and try again.';
      toast.error(errorMessage);
      // Set null to indicate error state - no mock data
      setAnalytics(null);
    } finally {
      setDataLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalRevenue = () => {
    // Use totalRevenue from analytics if available (all-time), otherwise sum revenueData (period-specific)
    if (analytics?.totalRevenue !== undefined) {
      return analytics.totalRevenue;
    }
    if (!analytics?.revenueData) return 0;
    return analytics.revenueData.reduce((sum, item) => sum + item.revenue, 0);
  };

  const getTotalEnrollments = () => {
    if (!analytics?.revenueData) return 0;
    return analytics.revenueData.reduce((sum, item) => sum + item.enrollments, 0);
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

  // Show error state if analytics failed to load
  if (!dataLoading && analytics === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Analytics</h3>
            <p className="text-gray-600 mb-6">
              We couldn't load your analytics data. This might be due to a connection issue or server problem.
            </p>
            <div className="space-y-3">
              <button
                onClick={loadAnalytics}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Retry Loading Analytics
              </button>
              <div>
                <button
                  onClick={() => router.push('/instructor/dashboard')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-2">
                Track your course performance and student engagement
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                  {analytics?.totalRevenue !== undefined && (
                    <span className="text-xs text-gray-500 ml-1">(All-time)</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalRevenue())}
                </p>
                {analytics?.period && analytics?.revenueData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Period ({analytics.period}): {formatCurrency(analytics.revenueData.reduce((sum, item) => sum + item.revenue, 0))}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTotalEnrollments()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.studentEngagement.activeStudents || 0}
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
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics?.studentEngagement.completionRate || 0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Revenue Over Time
              </h2>
            </div>
            
            {analytics?.revenueData && analytics.revenueData.length > 0 ? (
              <div className="space-y-4">
                {analytics.revenueData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (item.revenue / Math.max(...analytics.revenueData.map(d => d.revenue))) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No revenue data available for the selected period</p>
                <button
                  onClick={loadAnalytics}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>

          {/* Student Engagement */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Student Engagement
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Average Progress</span>
                  <span className="font-medium">{Math.round(analytics?.studentEngagement.averageProgress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analytics?.studentEngagement.averageProgress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{Math.round(analytics?.studentEngagement.completionRate || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analytics?.studentEngagement.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.studentEngagement.totalStudents || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.studentEngagement.activeStudents || 0}
                  </p>
                  <p className="text-sm text-gray-600">Active Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Courses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Top Performing Courses
              </h2>
            </div>
            
            {analytics?.topCourses && analytics.topCourses.length > 0 ? (
              <div className="space-y-4">
                {analytics.topCourses.map((course, index) => (
                  <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{course.course.title}</h3>
                        <p className="text-sm text-gray-600">{course.enrollments} enrollments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(course.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No course performance data available</p>
                <button
                  onClick={loadAnalytics}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recent Enrollments
              </h2>
            </div>
            
            {analytics?.recentEnrollments && analytics.recentEnrollments.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentEnrollments.map((enrollment) => (
                  <div key={enrollment._id} className="flex items-center space-x-3">
                    <img
                      src={enrollment.student.avatar || '/images/default-avatar.png'}
                      alt={enrollment.student.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {enrollment.student.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {enrollment.course.title}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(enrollment.enrolledAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No recent enrollments found</p>
                <button
                  onClick={loadAnalytics}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAnalyticsPage;
