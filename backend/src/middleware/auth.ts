import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { verifyAccessToken, extractToken } from '@/utils/jwt';
import { sendError } from '@/utils/response';
import User from '@/models/User';

/**
 * Middleware to authenticate user using JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from cookies or Authorization header
    const token = extractToken(req);

    if (!token) {
      sendError(res, 'Access token is required', 401);
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account has been deactivated', 401);
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendError(res, 'Invalid or expired token', 401);
  }
};

/**
 * Middleware to authorize user based on roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'admin') {
    sendError(res, 'Admin access required', 403);
    return;
  }

  next();
};

/**
 * Middleware to check if user is instructor
 */
export const requireInstructor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'instructor') {
    sendError(res, 'Instructor access required', 403);
    return;
  }

  next();
};

/**
 * Middleware to check if user is instructor or admin
 */
export const requireInstructorOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    sendError(res, 'Instructor or admin access required', 403);
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserField: string = 'user') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserField] || req.params.userId;

    if (req.user._id.toString() !== resourceUserId) {
      sendError(res, 'Access denied. You can only access your own resources.', 403);
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has valid enrollment for a course
 */
export const requireCourseEnrollment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const courseId = req.params.courseId || req.params.id;
    if (!courseId) {
      sendError(res, 'Course ID is required', 400);
      return;
    }

    // Import Order model here to avoid circular dependency
    const Order = require('@/models/Order').default;

    // Check if user has valid enrollment (latest enrollment must be completed)
    const latestEnrollment = await Order.findOne({
      user: req.user._id,
      'courses.course': courseId,
      $or: [
        { paymentStatus: 'paid' },
        { paymentMethod: 'instructor_enrollment' } // Allow instructor enrollments
      ]
    }).sort({ createdAt: -1 }); // Get the most recent enrollment

    if (!latestEnrollment) {
      sendError(res, 'You are not enrolled in this course', 403);
      return;
    }

    // Check if latest enrollment is cancelled
    if (latestEnrollment.status === 'cancelled') {
      sendError(res, 'Your enrollment in this course has been cancelled', 403);
      return;
    }

    // Check if latest enrollment is completed
    if (latestEnrollment.status !== 'completed') {
      sendError(res, 'Your enrollment in this course is not completed', 403);
      return;
    }

    // Attach enrollment info to request for further use
    req.enrollment = latestEnrollment;
    next();
  } catch (error) {
    console.error('Course enrollment check error:', error);
    sendError(res, 'Failed to verify course enrollment', 500);
  }
};

/**
 * Middleware to require email verification for premium features
 */
export const requireEmailVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (!req.user.isEmailVerified) {
    sendError(res, 'Email verification required. Please verify your email address to access this feature.', 403, {
      code: 'EMAIL_VERIFICATION_REQUIRED',
      action: 'verify_email',
      message: 'You must verify your email address before you can purchase courses or access premium features.',
      resendUrl: '/api/auth/send-verification-email'
    });
    return;
  }

  next();
};



/**
 * Combined middleware: authenticate + require email verification
 */
export const authenticateAndVerifyEmail = [authenticate, requireEmailVerification];

// Export aliases for backward compatibility
export const auth = authenticate;
