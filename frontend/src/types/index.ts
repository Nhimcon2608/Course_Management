// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  loginAttempts: number;
  lockUntil?: string;
  wishlist?: string[] | Course[];
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
  createdAt: string;
  updatedAt: string;
}

// Course Types
export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  instructor: string | User;
  category: string | Category;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  images?: string[];
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
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentCategory?: string | Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lesson Types
export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: Resource[];
}

// Resource Types
export interface Resource {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
  size?: number;
}

// Review Types
export interface Review {
  _id: string;
  user: string | User;
  course: string | Course;
  rating: number;
  title?: string;
  comment?: string;
  pros: string[];
  cons: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  totalVotes: number;
  votedBy: Array<{
    user: string | User;
    vote: 'helpful' | 'not_helpful';
    votedAt: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  moderatedBy?: string | User;
  moderatedAt?: string;
  isEdited: boolean;
  editedAt?: string;
  originalReview?: {
    rating: number;
    title?: string;
    comment?: string;
    editedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  _id: string;
  user: string | User;
  courses: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Order Item Types
export interface OrderItem {
  course: string | Course;
  price: number;
  discountAmount?: number;
}

// Cart Types
export interface Cart {
  _id: string;
  user: string | User;
  items: CartItem[];
  totalAmount: number;
  totalOriginalAmount: number;
  couponCode?: string;
  discountAmount: number;
  expiresAt: string;
  totalItems: number;
  totalSavings: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Cart Item Types
export interface CartItem {
  course: string | Course;
  price: number;
  originalPrice?: number;
  addedAt: string;
}

// Cart Summary Types
export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  totalOriginalAmount: number;
  totalSavings: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
}

// Progress Types
export interface Progress {
  _id: string;
  user: string | User;
  course: string | Course;
  completedLessons: string[];
  progressPercentage: number;
  lastAccessedLesson?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface VerifyTokenResponse {
  email: string;
  tokenValid: boolean;
}

export interface SendEmailVerificationData {
  email?: string;
}

export interface VerifyEmailResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken: string;
  refreshToken: string;
}

// Form Types
export interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  requirements: string[];
  whatYouWillLearn: string[];
  tags: string[];
  thumbnail?: File;
}

// Filter Types
export interface CourseFilters {
  search?: string;
  category?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

// Statistics Types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  popularCourses: Course[];
  userGrowth: Array<{ month: string; users: number }>;
  revenueGrowth: Array<{ month: string; revenue: number }>;
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  children?: NavItem[];
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
}

// Wishlist Types
export interface WishlistResponse {
  wishlist: Course[];
  count: number;
}

// Coupon Types
export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  remainingUsage: number;
  isActive: boolean;
  applicableCourses: string[] | Course[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResponse {
  coupon: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    minOrderAmount: number;
  };
  discountAmount: number;
  finalAmount: number;
  remainingUsage: number;
}

// Order Types
export interface OrderItem {
  course: string | Course;
  title: string;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  instructor: string;
  thumbnail?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  courses: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  finalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  paymentMethod: 'zalopay' | 'stripe' | 'paypal' | 'bank_transfer' | 'momo' | 'vnpay' | 'cash';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentId?: string;
  paymentDetails?: {
    transactionId?: string;
    zaloPayTransId?: string;
    zaloPayResponse?: any;
    gatewayResponse?: any;
    paidAt?: string;
    refundedAt?: string;
    refundAmount?: number;
    refundReason?: string;
  };
  billingAddress?: {
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
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  paymentMethod?: 'zalopay' | 'cash' | 'bank_transfer';
  billingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  notes?: string;
}

export interface ZaloPayPaymentResponse {
  orderUrl: string;
  zpTransToken: string;
  qrCode?: string;
  appTransId: string;
}

export interface PaymentStatusResponse {
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  completedAt?: string;
}

// Social Share Types
export interface SocialShareOptions {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export interface SocialPlatform {
  name: string;
  icon: React.ComponentType;
  shareUrl: (options: SocialShareOptions) => string;
  color: string;
}

// Store Types
export interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (courseId: string) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (couponCode: string, discountAmount: number) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export interface WishlistStore {
  wishlist: Course[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (courseId: string) => Promise<void>;
  removeFromWishlist: (courseId: string) => Promise<void>;
  isInWishlist: (courseId: string) => boolean;
}
