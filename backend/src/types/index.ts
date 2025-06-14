import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  wishlist?: string[] | ICourse[];
  // Instructor-specific fields
  bio?: string;
  expertise?: string[];
  qualifications?: string[];
  yearsOfExperience?: number;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  // Email verification fields
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IUser>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  generatePasswordResetToken(): string;
  clearPasswordResetToken(): void;
  generateEmailVerificationToken(): string;
  clearEmailVerificationToken(): void;
}

// Course Types
export interface ICourse extends Document {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  instructor: string | IUser;
  category: string | ICategory;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  images?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  lessons: ILesson[];
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
  createdAt: Date;
  updatedAt: Date;
  calculateAverageRating(): Promise<void>;
  // Virtual fields
  totalLessons?: number;
  totalDurationMinutes?: number;
  discountPercentage?: number;
}

// Category Types
export interface ICategory extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  color?: string;
  parentCategory?: string | ICategory;
  level: number;
  order: number;
  isActive: boolean;
  featured: boolean;
  courseCount: number;
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  updateCourseCount(): Promise<void>;
  getDescendants(): Promise<ICategory[]>;
}

// Lesson Types
export interface ILesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  isPreview: boolean;
  resources?: IResource[];
}

// Resource Types
export interface IResource {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
  size?: number;
}

// Review Types
export interface IReview extends Document {
  _id: string;
  user: string | IUser;
  course: string | ICourse;
  rating: number;
  title?: string;
  comment?: string;
  pros: string[];
  cons: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  totalVotes: number;
  votedBy: Array<{
    user: string | IUser;
    vote: 'helpful' | 'not_helpful';
    votedAt: Date;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  moderatedBy?: string | IUser;
  moderatedAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  originalReview?: {
    rating: number;
    title?: string;
    comment?: string;
    editedAt: Date;
  };
  replies: Array<{
    user: string | IUser;
    content: string;
    isInstructor: boolean;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  vote(userId: string, voteType: 'helpful' | 'not_helpful'): Promise<IReview>;
  addReply(userId: string, content: string, isInstructor?: boolean): Promise<IReview>;
  editReview(updates: { rating?: number; title?: string; comment?: string }): Promise<IReview>;
  moderate(status: string, moderatorId: string, notes?: string): Promise<IReview>;
}

// Order Types
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  user: string | IUser;
  courses: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  paymentMethod: 'zalopay' | 'stripe' | 'paypal' | 'bank_transfer' | 'momo' | 'vnpay' | 'cash';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentId?: string;
  paymentDetails: {
    transactionId?: string;
    zaloPayTransId?: string;
    zaloPayResponse?: any;
    gatewayResponse?: any;
    paidAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    refundReason?: string;
  };
  billingAddress: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  couponCode?: string;
  couponId?: string;
  finalAmount: number;
  notes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
  markAsCompleted(): Promise<void>;
  cancelOrder(reason?: string): Promise<void>;
  processRefund(amount?: number, reason?: string): Promise<void>;
}

// Order Item Types
export interface IOrderItem {
  course: string | ICourse;
  title: string;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  instructor: string;
  thumbnail?: string;
}

// Cart Types
export interface ICart extends Document {
  _id: string;
  user: string | IUser;
  items: ICartItem[];
  totalAmount: number;
  totalOriginalAmount: number;
  couponCode?: string;
  couponId?: string;
  discountAmount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  addCourse(courseId: string, price: number, originalPrice?: number): Promise<ICart>;
  removeCourse(courseId: string): Promise<ICart>;
  clearCart(): Promise<ICart>;
  applyCoupon(couponCode: string, discountAmount: number): Promise<ICart>;
  removeCoupon(): Promise<ICart>;
  hasCourse(courseId: string): boolean;
  getSummary(): any;
}

// Cart Item Types
export interface ICartItem {
  course: string | ICourse;
  price: number;
  originalPrice?: number;
  addedAt: Date;
}

// Progress Types
export interface IProgress extends Document {
  _id: string;
  user: string | IUser;
  course: string | ICourse;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  progressPercentage: number;
  completedLessons: string[];
  lessonsProgress: Array<{
    lesson: string;
    completed: boolean;
    completedAt?: Date;
    watchTime: number;
    totalTime: number;
    lastWatchedAt: Date;
  }>;
  currentLesson?: string;
  totalWatchTime: number;
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
  certificateId?: string;
  notes: Array<{
    lesson: string;
    content: string;
    timestamp?: number;
    createdAt: Date;
  }>;
  bookmarks: Array<{
    lesson: string;
    title: string;
    timestamp: number;
    createdAt: Date;
  }>;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  completeLesson(lessonId: string, watchTime?: number): Promise<IProgress>;
  updateWatchTime(lessonId: string, watchTime: number, totalTime: number): Promise<IProgress>;
  addNote(lessonId: string, content: string, timestamp?: number): Promise<IProgress>;
  addBookmark(lessonId: string, title: string, timestamp: number): Promise<IProgress>;
  issueCertificate(): Promise<IProgress>;
}

// Learning Achievement Types
export interface IAchievement extends Document {
  _id: string;
  user: string | IUser;
  type: 'course_completion' | 'learning_streak' | 'first_course' | 'milestone' | 'certificate';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  course?: string | ICourse;
  metadata?: {
    streakDays?: number;
    coursesCompleted?: number;
    hoursLearned?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Certificate Types
export interface ICertificate extends Document {
  _id: string;
  user: string | IUser;
  course: string | ICourse;
  certificateNumber: string;
  issuedAt: Date;
  completionDate: Date;
  grade?: number;
  skills: string[];
  instructorSignature?: string;
  isValid: boolean;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Activity Types
export interface ILearningActivity extends Document {
  _id: string;
  user: string | IUser;
  course: string | ICourse;
  lesson?: string;
  type: 'lesson_start' | 'lesson_complete' | 'course_enroll' | 'course_complete' | 'quiz_attempt' | 'note_added';
  description: string;
  metadata?: {
    watchTime?: number;
    score?: number;
    noteContent?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

// Learning Statistics Types
export interface ILearningStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalHoursLearned: number;
  currentStreak: number;
  longestStreak: number;
  averageProgress: number;
  certificatesEarned: number;
  achievementsUnlocked: number;
  lastActivityDate: Date;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

// Auth Types
export interface AuthRequest extends Request {
  user?: IUser;
  enrollment?: any; // For course enrollment middleware
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Types
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  filter?: Record<string, any>;
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

// Statistics Types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: IOrder[];
  popularCourses: ICourse[];
  userGrowth: Array<{ month: string; users: number }>;
  revenueGrowth: Array<{ month: string; revenue: number }>;
}
