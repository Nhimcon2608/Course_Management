'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { BookOpen, Users, ShoppingCart, TrendingUp, Clock, Award, Play, Calendar, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { dashboardApi, DashboardStats, EnrolledCourse, RecentActivity, RecommendedCourse } from '@/services/dashboardApi';
import { toast } from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Dashboard data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Dashboard: Initializing auth...');
    initializeAuth();

    // Mark auth as checked after a short delay
    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Dashboard: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect based on authentication and role
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Dashboard: Not authenticated, redirecting to login');
        router.push('/auth/login');
      } else if (user?.role === 'admin') {
        console.log('Dashboard: Admin user detected, redirecting to admin dashboard');
        router.push('/admin/dashboard');
      }
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [authChecked, isAuthenticated, user]);

  // Show loading while checking auth or loading
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!authChecked ? 'Checking authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated after check, show redirecting message
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);

      const [statsData, coursesData, activityData, recommendationsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getEnrolledCourses(6),
        dashboardApi.getRecentActivity(5),
        dashboardApi.getRecommendations(6)
      ]);

      setStats(statsData);
      setEnrolledCourses(coursesData);
      setRecentActivity(activityData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

  // Generate stats cards from real data
  const getStatsCards = () => {
    if (!stats) return [];

    return [
      {
        name: 'Enrolled Courses',
        value: stats.enrolledCourses.toString(),
        icon: BookOpen,
        color: 'bg-blue-500',
        change: `${stats.inProgressCourses} in progress`
      },
      {
        name: 'Completed Courses',
        value: stats.completedCourses.toString(),
        icon: Award,
        color: 'bg-green-500',
        change: `${stats.averageProgress}% avg progress`
      },
      {
        name: 'Learning Hours',
        value: stats.learningHours.toString(),
        icon: Clock,
        color: 'bg-purple-500',
        change: 'Total time spent'
      },
      {
        name: 'Certificates',
        value: stats.certificates.toString(),
        icon: TrendingUp,
        color: 'bg-yellow-500',
        change: 'Earned certificates'
      }
    ];
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng trở lại, {user?.name || 'User'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dataLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`stats-skeleton-${index}`} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-lg p-3 w-12 h-12"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : (
            getStatsCards().map((stat) => (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {dataLoading ? (
                    // Loading skeleton for courses
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`course-skeleton-${index}`} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                          <div className="h-2 bg-gray-300 rounded w-full"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                    ))
                  ) : enrolledCourses.length > 0 ? (
                    enrolledCourses.map((course) => (
                      <div key={course._id} className="flex items-center space-x-4">
                        <img
                          src={course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            by {course.instructor || 'Unknown Instructor'}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{course.progress.progressPercentage}%</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${course.progress.progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatTimeAgo(course.progress.lastAccessedAt)}</p>
                          <button
                            onClick={() => router.push(`/courses/${course.slug}`)}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No enrolled courses yet</p>
                      <button
                        onClick={() => router.push('/courses')}
                        className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Browse Courses
                      </button>
                    </div>
                  )}
                </div>
                {enrolledCourses.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/learning')}
                      className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All Courses
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                {user?.avatar ? (
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    className="w-20 h-20 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary-600 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <h3 className="mt-4 text-lg font-medium text-gray-900">{user?.name || 'User'}</h3>
                <p className="text-sm text-gray-500">{user?.email || 'No email'}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role || 'user'}</p>
                <button className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </button>
                <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Cart
                </button>
                <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Award className="h-4 w-4 mr-2" />
                  My Certificates
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended for You</h3>
              <div className="space-y-4">
                {dataLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <div key={`recommendation-skeleton-${index}`} className="animate-pulse">
                      <div className="h-20 bg-gray-300 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  ))
                ) : recommendations.length > 0 ? (
                  recommendations.slice(0, 2).map((course) => (
                    <div key={course._id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/courses/${course.slug}`)}>
                      <img
                        src={course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                        alt={course.title}
                        className="w-full h-20 object-cover rounded mb-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                        }}
                      />
                      <h4 className="text-sm font-medium text-gray-900 truncate">{course.title}</h4>
                      <p className="text-xs text-gray-500">
                        by {course.instructor?.name || 'Unknown Instructor'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary-600">
                          {formatNumber(course.price, 'vi-VN')}đ
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          {course.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recommendations available</p>
                )}
              </div>
              {recommendations.length > 2 && (
                <button
                  onClick={() => router.push('/courses')}
                  className="w-full mt-4 text-center py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View More
                </button>
              )}
            </div>

            {/* Learning Streak */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Learning Progress</h3>
              <div className="text-3xl font-bold">{stats?.averageProgress || 0}%</div>
              <p className="text-primary-100 text-sm">Average completion rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
