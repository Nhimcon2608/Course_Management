import { apiClient } from '@/lib/api';
import api from '@/lib/api';

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  publishedCourses: number;
  draftCourses: number;
  monthlyRevenue: number;
  monthlyEnrollments: number;
}

export interface InstructorCourse {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  enrolledStudents: number;
  rating: number;
  reviewCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    _id: string;
    name: string;
  };
}

export interface StudentEnrollment {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    _id: string;
    title: string;
  };
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
}



export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  requirements?: string[];
  whatYouWillLearn: string[];
  tags?: string[];
  thumbnail?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  isPublished?: boolean;
}

export interface InstructorStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    _id: string;
    title: string;
  };
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
}

export interface InstructorAnalytics {
  revenueData: Array<{
    month: string;
    revenue: number;
    enrollments: number;
  }>;
  topCourses: Array<{
    _id: string;
    revenue: number;
    enrollments: number;
    course: {
      _id: string;
      title: string;
      thumbnail?: string;
    };
  }>;
  studentEngagement: {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    averageProgress: number;
  };
  recentEnrollments: Array<{
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    course: {
      _id: string;
      title: string;
    };
    enrolledAt: string;
  }>;
}

export interface InstructorProfile {
  _id: string;
  name: string;
  email: string;
  role: 'instructor';
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  expertise?: string[];
  qualifications?: string[];
  yearsOfExperience?: number;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  teachingStats?: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
  };
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  expertise?: string[];
  qualifications?: string[];
  yearsOfExperience?: number;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

class InstructorDashboardAPI {
  private baseUrl = '/instructor'; // Remove /api prefix since apiClient already has it

  // Dashboard Stats
  async getStats(): Promise<InstructorStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  // Course Management
  async getCourses(params?: {
    limit?: number;
    offset?: number;
    status?: 'published' | 'draft' | 'all';
    search?: string;
  }): Promise<InstructorCourse[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`${this.baseUrl}/courses?${queryParams.toString()}`);

    // Handle both direct array response and wrapped response
    if (response.data && response.data.courses) {
      return response.data.courses;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('Unexpected response format:', response.data);
      return [];
    }
  }

  async getCourse(courseId: string): Promise<InstructorCourse> {
    const response = await apiClient.get(`${this.baseUrl}/courses/${courseId}`);

    // Handle both direct course response and wrapped response
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid course response format');
    }
  }

  async createCourse(courseData: CreateCourseData): Promise<InstructorCourse> {
    const response = await apiClient.post(`${this.baseUrl}/courses`, courseData);

    // Handle both direct course response and wrapped response
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid course response format');
    }
  }

  async updateCourse(courseId: string, courseData: UpdateCourseData): Promise<InstructorCourse> {
    const response = await apiClient.put(`${this.baseUrl}/courses/${courseId}`, courseData);

    // Handle both direct course response and wrapped response
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid course response format');
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/courses/${courseId}`);
  }

  // Student Management
  async getStudents(params?: {
    limit?: number;
    offset?: number;
    courseId?: string;
    search?: string;
  }): Promise<{ students: InstructorStudent[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`${this.baseUrl}/students?${queryParams}`);
    return response.data;
  }

  async addStudent(data: {
    email: string;
    courseId: string;
  }): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/students`, data);
    return response.data;
  }

  async updateStudent(id: string, data: {
    progress?: number;
    notes?: string;
  }): Promise<any> {
    const response = await apiClient.put(`${this.baseUrl}/students/${id}`, data);
    return response.data;
  }

  async removeStudent(id: string): Promise<any> {
    const response = await apiClient.delete(`${this.baseUrl}/students/${id}`);
    return response.data;
  }



  // Course Publishing
  async publishCourse(id: string): Promise<InstructorCourse> {
    const response = await apiClient.put(`${this.baseUrl}/courses/${id}`, {
      isPublished: true,
      status: 'published'
    });

    // Handle both direct course response and wrapped response
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid course response format');
    }
  }

  async unpublishCourse(id: string): Promise<InstructorCourse> {
    const response = await apiClient.put(`${this.baseUrl}/courses/${id}`, {
      isPublished: false,
      status: 'draft'
    });

    // Handle both direct course response and wrapped response
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid course response format');
    }
  }



  async getStudentProgress(studentId: string, courseId: string): Promise<{
    student: StudentEnrollment['student'];
    course: StudentEnrollment['course'];
    progress: number;
    completedLessons: string[];
    totalLessons: number;
    timeSpent: number;
    lastAccessedAt: string;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/students/${studentId}/progress/${courseId}`);
    return response.data;
  }

  // Analytics
  async getAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<InstructorAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/analytics?period=${period}`);
    return response.data;
  }

  async getRevenueData(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<{
    month: string;
    revenue: number;
    enrollments: number;
  }[]> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);

    const response = await apiClient.get(`${this.baseUrl}/analytics/revenue?${queryParams.toString()}`);
    return response.data;
  }

  // Content Management
  async uploadThumbnail(courseId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await apiClient.post(`${this.baseUrl}/courses/${courseId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadVideo(courseId: string, lessonId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await apiClient.post(
      `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Notifications
  async sendNotificationToStudents(courseId: string, notification: {
    title: string;
    message: string;
    type: 'announcement' | 'update' | 'reminder';
  }): Promise<void> {
    await apiClient.post(`${this.baseUrl}/courses/${courseId}/notifications`, notification);
  }

  // Bulk Operations
  async bulkUpdateCourses(courseIds: string[], updates: Partial<UpdateCourseData>): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/courses/bulk`, {
      courseIds,
      updates,
    });
  }

  async exportStudentData(courseId: string, format: 'csv' | 'excel' = 'csv', search?: string): Promise<Blob> {
    const params: any = { format };
    if (courseId && courseId !== '') {
      params.courseId = courseId;
    }
    if (search) {
      params.search = search;
    }

    // Use axios directly for blob responses since apiClient wrapper extracts .data
    const response = await api.get(`${this.baseUrl}/students/export`, {
      params,
      responseType: 'blob',
    });

    console.log('Export API response:', {
      status: response.status,
      contentType: response.headers['content-type'],
      dataType: typeof response.data,
      dataSize: response.data?.size || response.data?.byteLength || 'unknown'
    });

    return response.data;
  }

  // Profile Management
  async getProfile(): Promise<InstructorProfile> {
    const response = await apiClient.get(`${this.baseUrl}/profile`);

    // Handle both direct profile response and wrapped response
    if (response.data && response.data.data && response.data.data.profile) {
      return response.data.data.profile;
    } else if (response.data && response.data.profile) {
      return response.data.profile;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid profile response format');
    }
  }

  async updateProfile(profileData: UpdateProfileData): Promise<InstructorProfile> {
    const response = await apiClient.put(`${this.baseUrl}/profile`, profileData);

    // Handle both direct profile response and wrapped response
    if (response.data && response.data.data && response.data.data.profile) {
      return response.data.data.profile;
    } else if (response.data && response.data.profile) {
      return response.data.profile;
    } else if (response.data && response.data._id) {
      return response.data;
    } else {
      throw new Error('Invalid profile response format');
    }
  }

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post(`${this.baseUrl}/profile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const instructorDashboardApi = new InstructorDashboardAPI();
