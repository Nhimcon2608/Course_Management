import crypto from 'crypto';
import { QueryOptions } from '@/types';

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Create slug from string
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Calculate pagination
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const pages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    total,
    pages,
    skip,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * Build MongoDB query from options
 */
export const buildQuery = (options: QueryOptions) => {
  const query: any = {};
  
  if (options.search) {
    query.$or = [
      { title: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
      { tags: { $in: [new RegExp(options.search, 'i')] } }
    ];
  }
  
  if (options.filter) {
    Object.assign(query, options.filter);
  }
  
  return query;
};

/**
 * Build sort object from string
 */
export const buildSort = (sortString?: string) => {
  if (!sortString) return { createdAt: -1 };
  
  const sortObj: any = {};
  const sortFields = sortString.split(',');
  
  sortFields.forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });
  
  return sortObj;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (originalPrice: number, salePrice: number): number => {
  if (originalPrice <= 0 || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Generate course code
 */
export const generateCourseCode = (title: string): string => {
  const slug = createSlug(title);
  const randomSuffix = generateRandomString(4);
  return `${slug}-${randomSuffix}`.toUpperCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Calculate course rating average
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

/**
 * Format duration in hours to human readable format
 */
export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
};

/**
 * Check if user can access course
 */
export const canAccessCourse = (userRole: string, courseStatus: string): boolean => {
  if (userRole === 'admin') return true;
  return courseStatus === 'published';
};

/**
 * Generate video URL for frontend serving
 */
export const getVideoUrl = (videoPath: string): string => {
  if (!videoPath) return '';

  // If it's already a full URL, return as is
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    return videoPath;
  }

  // If it's a YouTube URL, return as is
  if (videoPath.includes('youtube.com') || videoPath.includes('youtu.be')) {
    return videoPath;
  }

  // For local video files, they should be served from frontend static directory
  // The path should start with /videos/ for frontend static serving
  if (videoPath.startsWith('/videos/')) {
    return videoPath; // Frontend will serve this directly
  }

  // Legacy support for old /uploads/ paths - convert to new format
  if (videoPath.startsWith('/uploads/videos/')) {
    return videoPath.replace('/uploads/videos/', '/videos/');
  }

  // If it's just a filename, prepend /videos/
  if (!videoPath.startsWith('/')) {
    return `/videos/${videoPath}`;
  }

  return videoPath;
};

/**
 * Generate secure filename
 */
export const generateSecureFilename = (originalName: string): string => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `${timestamp}-${random}.${extension}`;
};
