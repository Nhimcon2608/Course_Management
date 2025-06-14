import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthRequest } from '@/types';

// Store for tracking email verification attempts per email
const verificationAttempts = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationAttempts.entries()) {
    if (now > data.resetTime) {
      verificationAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000); // 1 hour

/**
 * Rate limiter for email verification requests
 * Max 5 requests per hour per IP address
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many email verification requests. Please try again in 1 hour.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use IP address as the key for rate limiting
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    console.log(`🚫 Email verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many email verification requests. Please try again in 1 hour.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Email-specific rate limiter for email verification
 * Max 3 requests per email per hour
 */
export const emailSpecificVerificationLimiter = (req: AuthRequest, res: Response, next: Function) => {
  const email = req.body.email?.toLowerCase() || req.user?.email?.toLowerCase();
  
  if (!email) {
    return next();
  }

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 3;

  const attemptData = verificationAttempts.get(email);

  if (attemptData) {
    // Check if the window has expired
    if (now > attemptData.resetTime) {
      // Reset the counter
      verificationAttempts.set(email, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Check if max attempts reached
    if (attemptData.count >= maxAttempts) {
      const remainingTime = Math.ceil((attemptData.resetTime - now) / 1000 / 60);
      console.log(`🚫 Email verification limit exceeded for: ${email}`);
      return res.status(429).json({
        success: false,
        message: `Too many verification emails sent to this address. Please try again in ${remainingTime} minutes.`,
        error: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
        remainingTime
      });
    }

    // Increment the counter
    attemptData.count++;
  } else {
    // First attempt for this email
    verificationAttempts.set(email, { count: 1, resetTime: now + windowMs });
  }

  next();
};

/**
 * Reset rate limit for an email (used after successful verification)
 */
export const resetEmailVerificationRateLimit = (email: string) => {
  if (email) {
    verificationAttempts.delete(email.toLowerCase());
    console.log(`✅ Email verification rate limit cleared for: ${email}`);
  }
};

/**
 * Get remaining attempts for an email
 */
export const getRemainingVerificationAttempts = (email: string): { remaining: number; resetTime?: number } => {
  const attemptData = verificationAttempts.get(email.toLowerCase());
  
  if (!attemptData) {
    return { remaining: 3 };
  }

  const now = Date.now();
  if (now > attemptData.resetTime) {
    // Window expired, reset
    verificationAttempts.delete(email.toLowerCase());
    return { remaining: 3 };
  }

  return {
    remaining: Math.max(0, 3 - attemptData.count),
    resetTime: attemptData.resetTime
  };
};
