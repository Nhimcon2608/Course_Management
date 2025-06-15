import { apiClient } from '@/lib/api';

// Types for Admin Dashboard
export interface AdminStats {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalOrders: number;
    totalCategories: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalCoursesSold: number;
  };
  courses: {
    published: number;
    draft: number;
    archived: number;
  };
  users: {
    verified: number;
    unverified: number;
    active: number;
    inactive: number;
    byRole: Array<{ _id: string; count: number }>;
  };
  recentActivity: {
    newUsers: number;
    newCourses: number;
    newOrders: number;
    revenueThisMonth: number;
  };
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    orders: number;
  }>;
  userGrowth: Array<{
    _id: { year: number; month: number };
    users: number;
  }>;
  topCourses: Array<{
    _id: string;
    title: string;
    thumbnail: string;
    price: number;
    rating: number;
    enrolledStudents: number;
    revenue: number;
    enrollments: number;
  }>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    coursesEnrolled: number;
  };
}

export interface AdminCourse {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  enrolledStudents: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  category: {
    _id: string;
    name: string;
  };
  stats: {
    totalEnrollments: number;
    totalRevenue: number;
  };
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Admin API Service
export const adminApi = {
  // Get admin dashboard statistics
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<{ stats: AdminStats }>('/admin/stats');
    return response.data!.stats;
  },

  // User Management
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginationResponse<AdminUser>> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiClient.get<{
      users: AdminUser[];
      pagination: PaginationResponse<AdminUser>['pagination'];
    }>(`/admin/users?${searchParams.toString()}`);

    return {
      data: response.data!.users,
      pagination: response.data!.pagination
    };
  },

  // Update user role
  updateUserRole: async (userId: string, role: 'student' | 'instructor' | 'admin'): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/role`, { role });
  },

  // Toggle user status
  toggleUserStatus: async (userId: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/status`);
  },

  // Course Management
  getCourses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    instructor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginationResponse<AdminCourse>> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiClient.get<{
      courses: AdminCourse[];
      pagination: PaginationResponse<AdminCourse>['pagination'];
    }>(`/admin/courses?${searchParams.toString()}`);

    return {
      data: response.data!.courses,
      pagination: response.data!.pagination
    };
  },

  // Update course status
  updateCourseStatus: async (
    courseId: string,
    status: 'draft' | 'published' | 'archived',
    reason?: string
  ): Promise<void> => {
    await apiClient.put(`/admin/courses/${courseId}/status`, { status, reason });
  },

  // Toggle course featured status
  toggleCourseFeatured: async (courseId: string): Promise<void> => {
    await apiClient.put(`/admin/courses/${courseId}/featured`);
  },

  // Delete course
  deleteCourse: async (courseId: string, force = false): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}`, {
      data: { force }
    });
  },

  // Financial Analytics
  getFinancialAnalytics: async (params: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  } = {}): Promise<{
    revenue: Array<{ date: string; amount: number; orders: number }>;
    topInstructors: Array<{ instructor: any; revenue: number; courses: number }>;
    paymentMethods: Array<{ method: string; count: number; revenue: number }>;
    refunds: Array<{ date: string; amount: number; count: number }>;
  }> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiClient.get<any>(`/admin/analytics/financial?${searchParams.toString()}`);
    return response.data!;
  },

  // System Health
  getSystemHealth: async (): Promise<{
    database: { status: string; responseTime: number };
    email: { status: string; lastSent?: string };
    storage: { used: number; total: number; percentage: number };
    errors: Array<{ timestamp: string; level: string; message: string }>;
  }> => {
    const response = await apiClient.get<any>('/admin/system/health');
    return response.data!;
  },

  // Enhanced User Management
  createUser: async (userData: {
    name: string;
    email: string;
    role?: 'student' | 'instructor' | 'admin';
    password?: string;
    sendWelcomeEmail?: boolean;
  }): Promise<{ user: AdminUser; temporaryPassword?: string }> => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data as { user: AdminUser; temporaryPassword?: string };
  },

  updateUserProfile: async (userId: string, userData: {
    name?: string;
    email?: string;
    bio?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }): Promise<{ user: AdminUser }> => {
    const response = await apiClient.put(`/admin/users/${userId}`, userData);
    return response.data as { user: AdminUser };
  },

  deleteUser: async (userId: string, force = false): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`, {
      data: { force }
    });
  },

  bulkUserOperations: async (data: {
    operation: 'activate' | 'deactivate' | 'changeRole' | 'delete';
    userIds: string[];
    data?: any;
  }): Promise<{ modifiedCount: number; operation: string }> => {
    const response = await apiClient.post('/admin/users/bulk', data);
    return response.data as { modifiedCount: number; operation: string };
  },

  // Analytics
  getAnalytics: async (params: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    type?: 'overview' | 'revenue' | 'users' | 'courses' | 'system';
  }): Promise<{ analytics: any }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await apiClient.get(`/admin/analytics?${searchParams.toString()}`);
    return response.data as { analytics: any };
  }
};
