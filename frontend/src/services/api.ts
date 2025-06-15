import axios from 'axios';
import { mockCategories, mockCourses, mockReviews } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'; // Default to false, use real API

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CourseFilters extends PaginationParams {
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';
  featured?: boolean;
  instructor?: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    expertise?: string[];
    socialLinks?: any;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
  };
  price: number;
  originalPrice?: number;
  thumbnail: string;
  images: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: Lesson[];
  requirements: string[];
  whatYouWillLearn: string[];
  tags: string[];
  isPublished: boolean;
  enrolledStudents: number;
  rating: number;
  totalRatings: number;
  language: string;
  subtitles: string[];
  certificate: boolean;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  totalLessons?: number;
  totalDurationMinutes?: number;
  discountPercentage?: number;
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources: LessonResource[];
}

export interface LessonResource {
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
  size?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  color?: string;
  parentCategory?: string;
  level: number;
  order: number;
  isActive: boolean;
  featured: boolean;
  courseCount: number;
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
  children?: Category[];
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  course: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Course API
export const courseApi = {
  // Get all courses with filters
  getCourses: async (filters: CourseFilters = {}): Promise<ApiResponse<{ courses: Course[]; pagination: any }>> => {
    if (USE_MOCK_DATA) {
      // Filter mock data
      let filteredCourses = [...mockCourses];

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCourses = filteredCourses.filter(course =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description.toLowerCase().includes(searchTerm) ||
          course.shortDescription.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.level) {
        filteredCourses = filteredCourses.filter(course => course.level === filters.level);
      }

      if (filters.category) {
        filteredCourses = filteredCourses.filter(course => course.category._id === filters.category);
      }

      // Sort
      switch (filters.sortBy) {
        case 'rating':
          filteredCourses.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filteredCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price-low':
          filteredCourses.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredCourses.sort((a, b) => b.price - a.price);
          break;
        default: // popular
          filteredCourses.sort((a, b) => b.enrolledStudents - a.enrolledStudents);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          courses: paginatedCourses,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredCourses.length / limit),
            totalItems: filteredCourses.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < filteredCourses.length,
            hasPrevPage: page > 1
          }
        }
      };
    }

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/courses?${params.toString()}`);
      return response.data as ApiResponse<{ courses: Course[]; pagination: any; }>;
    } catch (error) {
      console.error('API call failed for courses:', error);
      throw error; // Don't fall back to mock data, let the component handle the error
    }
  },

  // Get single course by ID or slug
  getCourse: async (id: string): Promise<ApiResponse<{ course: Course; reviews: Review[]; relatedCourses: Course[]; isEnrolled: boolean }>> => {
    if (USE_MOCK_DATA) {
      const course = mockCourses.find(c => c._id === id || c.slug === id);
      if (!course) {
        throw new Error('Course not found');
      }

      const reviews = mockReviews.filter(r => r.course === course._id);
      const relatedCourses = mockCourses
        .filter(c => c._id !== course._id && c.category._id === course.category._id)
        .slice(0, 4);

      return {
        success: true,
        data: {
          course,
          reviews,
          relatedCourses,
          isEnrolled: false
        }
      };
    }

    try {
      const response = await api.get(`/courses/${id}`);
      return response.data as ApiResponse<{ course: Course; reviews: Review[]; relatedCourses: Course[]; isEnrolled: boolean; }>;
    } catch (error) {
      console.error('API call failed for course:', id, error);
      throw error; // Don't fall back to mock data, let the component handle the error
    }
  },

  // Get course reviews
  getCourseReviews: async (courseId: string, params: PaginationParams & { rating?: number } = {}): Promise<ApiResponse<{ reviews: Review[]; pagination: any }>> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/courses/${courseId}/reviews?${queryParams.toString()}`);
    return response.data as ApiResponse<{ reviews: Review[]; pagination: any; }>;
  },

  // Enroll in course
  enrollInCourse: async (courseId: string): Promise<ApiResponse> => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data as ApiResponse<any>;
  },
};

// Category API
export const categoryApi = {
  // Get all categories
  getCategories: async (params: { includeInactive?: boolean; featured?: boolean; tree?: boolean } = {}): Promise<ApiResponse<{ categories: Category[] }>> => {
    if (USE_MOCK_DATA) {
      let categories = [...mockCategories];

      if (params.featured !== undefined) {
        categories = categories.filter(cat => cat.featured === params.featured);
      }

      return {
        success: true,
        data: { categories }
      };
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value !== '') {
            queryParams.append(key, value);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/categories?${queryParams.toString()}`);
      return response.data as ApiResponse<{ categories: Category[]; }>;
    } catch (error) {
      console.error('API call failed for categories:', error);
      throw error; // Don't fall back to mock data, let the component handle the error
    }
  },

  // Get single category
  getCategory: async (id: string, includePath = false): Promise<ApiResponse<{ category: Category; path: any[] }>> => {
    const response = await api.get(`/categories/${id}?includePath=${includePath}`);
    return response.data as ApiResponse<{ category: Category; path: any[] }>;
  },

  // Get courses by category
  getCategoryCourses: async (categoryId: string, filters: Omit<CourseFilters, 'category'> = {}): Promise<ApiResponse<{ category: Category; categoryPath: any[]; courses: Course[]; pagination: any }>> => {
    if (USE_MOCK_DATA) {
      const category = mockCategories.find(c => c._id === categoryId || c.slug === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      let courses = mockCourses.filter(course => course.category._id === category._id);

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        courses = courses.filter(course =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.level) {
        courses = courses.filter(course => course.level === filters.level);
      }

      // Sort
      switch (filters.sortBy) {
        case 'rating':
          courses.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price-low':
          courses.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          courses.sort((a, b) => b.price - a.price);
          break;
        default: // popular
          courses.sort((a, b) => b.enrolledStudents - a.enrolledStudents);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCourses = courses.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          category,
          categoryPath: [category],
          courses: paginatedCourses,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(courses.length / limit),
            totalItems: courses.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < courses.length,
            hasPrevPage: page > 1
          }
        }
      };
    }

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value !== '') {
            params.append(key, value);
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/categories/${categoryId}/courses?${params.toString()}`);
      return response.data as ApiResponse<{ category: Category; categoryPath: any[]; courses: Course[]; pagination: any }>;
    } catch (error) {
      console.error('API call failed for category courses:', error);
      throw error; // Don't fall back to mock data, let the component handle the error
    }
  },
};

export default api;
