import axios from 'axios';
import { ApiResponse } from '@/types';

// Create a separate axios instance for backend API calls
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  learningHours: number;
  certificates: number;
  totalSpent: number;
  averageProgress: number;
}

export interface EnrolledCourse {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  instructor: string;
  level: string;
  duration: number;
  totalLessons: number;
  enrolledAt: string;
  progress: {
    progressPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    lastAccessedAt: string;
    completedLessons: string[];
    totalWatchTime: number;
  };
}

export interface RecentActivity {
  type: string;
  course: {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    instructor: {
      name: string;
    };
  };
  progressPercentage: number;
  lastAccessedAt: string;
  status: string;
  completedLessons: number;
  totalLessons: number;
}

export interface RecommendedCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  instructor: {
    _id: string;
    name: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  price: number;
  originalPrice?: number;
  level: string;
  duration: number;
  rating: number;
  totalRatings: number;
  enrolledStudents: number;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await backendApi.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/stats');
      return response.data.data!.stats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return mock data as fallback
      return {
        enrolledCourses: 3,
        completedCourses: 1,
        inProgressCourses: 2,
        learningHours: 24,
        certificates: 1,
        totalSpent: 3897000,
        averageProgress: 51
      };
    }
  },

  // Get enrolled courses with progress
  getEnrolledCourses: async (limit?: number): Promise<EnrolledCourse[]> => {
    try {
      const response = await backendApi.get<ApiResponse<{ courses: EnrolledCourse[] }>>('/dashboard/enrolled-courses', {
        params: { limit }
      });
      return response.data.data!.courses;
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
      // Return mock data as fallback
      return [];
    }
  },

  // Get recent learning activity
  getRecentActivity: async (limit?: number): Promise<RecentActivity[]> => {
    try {
      const response = await backendApi.get<ApiResponse<{ activities: RecentActivity[] }>>('/dashboard/recent-activity', {
        params: { limit }
      });
      return response.data.data!.activities;
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      // Return mock data as fallback
      return [];
    }
  },

  // Get course recommendations
  getRecommendations: async (limit?: number): Promise<RecommendedCourse[]> => {
    try {
      const response = await backendApi.get<ApiResponse<{ courses: RecommendedCourse[] }>>('/dashboard/recommendations', {
        params: { limit }
      });
      return response.data.data!.courses;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Return mock data as fallback
      return [];
    }
  }
};
