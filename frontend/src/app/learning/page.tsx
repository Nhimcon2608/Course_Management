'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  BookOpenIcon, 
  ClockIcon, 
  TrophyIcon, 
  FireIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  StarIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LearningStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalHoursLearned: number;
  currentStreak: number;
  longestStreak: number;
  averageProgress: number;
  certificatesEarned: number;
  achievementsUnlocked: number;
  lastActivityDate: string;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

interface CourseProgress {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  instructor: {
    name: string;
    avatar: string;
  };
  category: {
    name: string;
    slug: string;
  };
  duration: number;
  level: string;
  rating: number;
  progress: {
    progressPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed';
    totalWatchTime: number;
    lastAccessedAt: string;
  };
}

interface Achievement {
  _id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  course?: {
    title: string;
    thumbnail: string;
  };
}

interface LearningActivity {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  course: {
    title: string;
    thumbnail: string;
  };
}

export default function LearningPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [recommendations, setRecommendations] = useState<CourseProgress[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check email verification
    if (!user?.isEmailVerified) {
      toast.error('Please verify your email address to access learning content', {
        icon: '📧',
        duration: 6000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #F59E0B'
        }
      });
      router.push('/auth/verify-email');
      return;
    }

    fetchLearningData();
  }, [isAuthenticated, user, router]);

  const fetchLearningData = async () => {
    try {
      setLoading(true);

      // Fetch all learning data in parallel using Next.js API routes
      const [statsRes, coursesRes, achievementsRes, activitiesRes, recommendationsRes] = await Promise.allSettled([
        fetch('/api/learning/statistics', { credentials: 'include' }),
        fetch('/api/learning/courses?limit=12', { credentials: 'include' }),
        fetch('/api/learning/achievements?limit=6', { credentials: 'include' }),
        fetch('/api/learning/activities?limit=10', { credentials: 'include' }),
        fetch('/api/learning/recommendations?limit=6', { credentials: 'include' })
      ]);

      // Handle statistics
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json();
        if (data.success) {
          setStats(data.data.stats);
        }
      } else {
        console.error('Failed to fetch learning statistics:', statsRes.status === 'rejected' ? statsRes.reason : 'API error');
      }

      // Handle courses
      if (coursesRes.status === 'fulfilled' && coursesRes.value.ok) {
        const data = await coursesRes.value.json();
        if (data.success) {
          setCourses(data.data.courses);
        }
      } else {
        console.error('Failed to fetch learning courses:', coursesRes.status === 'rejected' ? coursesRes.reason : 'API error');
      }

      // Handle achievements
      if (achievementsRes.status === 'fulfilled' && achievementsRes.value.ok) {
        const data = await achievementsRes.value.json();
        if (data.success) {
          setAchievements(data.data.achievements);
        }
      } else {
        console.error('Failed to fetch achievements:', achievementsRes.status === 'rejected' ? achievementsRes.reason : 'API error');
      }

      // Handle activities
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const data = await activitiesRes.value.json();
        if (data.success) {
          setActivities(data.data.activities);
        }
      } else {
        console.error('Failed to fetch activities:', activitiesRes.status === 'rejected' ? activitiesRes.reason : 'API error');
      }

      // Handle recommendations
      if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value.ok) {
        const data = await recommendationsRes.value.json();
        if (data.success) {
          setRecommendations(data.data.recommendations);
        }
      } else {
        console.error('Failed to fetch recommendations:', recommendationsRes.status === 'rejected' ? recommendationsRes.reason : 'API error');
      }

    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast.error('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (activeTab === 'all') return true;
    return course.progress.status === activeTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'not_started':
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <BookOpenIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning</h1>
          <p className="text-gray-600">Track your progress and continue your learning journey</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalCoursesEnrolled}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalCoursesCompleted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Hours Learned</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalHoursLearned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FireIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Streak</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.currentStreak} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
                  <div className="flex items-center space-x-4">
                    {/* Filter Tabs */}
                    <div className="flex space-x-1">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'in_progress', label: 'In Progress' },
                        { key: 'completed', label: 'Completed' },
                        { key: 'not_started', label: 'Not Started' }
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            activeTab === tab.key
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all' 
                        ? "You haven't enrolled in any courses yet."
                        : `No ${activeTab.replace('_', ' ')} courses found.`
                      }
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/courses"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCourses.map((course) => (
                      <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <img
                            src={course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                            alt={course.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  <Link href={`/courses/${course.slug}`} className="hover:text-blue-600">
                                    {course.title}
                                  </Link>
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  by {course.instructor?.name || 'Unknown Instructor'} • {course.category?.name || 'Unknown Category'}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {formatDuration(course.duration)}
                                  </span>
                                  <span className="flex items-center">
                                    <StarIcon className="h-4 w-4 mr-1" />
                                    {course.rating}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.progress.status)}`}>
                                    {getStatusIcon(course.progress.status)}
                                    <span className="ml-1 capitalize">{course.progress.status.replace('_', ' ')}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {course.progress.progressPercentage}% Complete
                                </div>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${course.progress.progressPercentage}%` }}
                                  ></div>
                                </div>
                                {course.progress.lastAccessedAt && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Last accessed: {formatDate(course.progress.lastAccessedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                Watch time: {Math.round(course.progress.totalWatchTime / 60)} minutes
                              </div>
                              <Link
                                href={`/courses/${course._id}/learn`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                              >
                                {course.progress.status === 'not_started' ? 'Start Learning' : 'Continue Learning'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement._id} className="flex items-start space-x-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-xs text-gray-500">{achievement.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(achievement.earnedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {achievements.length > 3 && (
                    <div className="mt-4">
                      <Link
                        href="/achievements"
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        View all achievements →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Learning Activity */}
            {activities.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-3">
                        <img
                          src={activity.course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                          alt={activity.course.title}
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((course) => (
                      <div key={course._id} className="flex items-start space-x-3">
                        <img
                          src={course.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            <Link href={`/courses/${course.slug}`} className="hover:text-blue-600">
                              {course.title}
                            </Link>
                          </h4>
                          <p className="text-xs text-gray-500">{course.instructor.name}</p>
                          <div className="flex items-center mt-1">
                            <StarIcon className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs text-gray-500 ml-1">{course.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/courses"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Browse all courses →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
