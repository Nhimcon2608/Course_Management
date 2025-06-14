import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Store for tracking password reset attempts per email
const resetAttempts = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of resetAttempts.entries()) {
    if (now > data.resetTime) {
      resetAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000); // 1 hour

/**
 * Rate limiter for password reset requests
 * Max 5 requests per 15 minutes per email address
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use IP address as the key for rate limiting
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    console.log(`🚫 Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again in 15 minutes.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Email-specific rate limiter for password reset
 * Max 3 requests per email per 15 minutes
 */
export const emailPasswordResetLimiter = (req: Request, res: Response, next: Function) => {
  const email = req.body.email?.toLowerCase();
  
  if (!email) {
    return next();
  }

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3;

  const attemptData = resetAttempts.get(email);

  if (attemptData) {
    // Check if the window has expired
    if (now > attemptData.resetTime) {
      // Reset the counter
      resetAttempts.set(email, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Check if max attempts reached
    if (attemptData.count >= maxAttempts) {
      const remainingTime = Math.ceil((attemptData.resetTime - now) / 1000 / 60);
      console.log(`🚫 Password reset email limit exceeded for: ${email}`);
      return res.status(429).json({
        success: false,
        message: `Too many password reset requests for this email. Please try again in ${remainingTime} minutes.`,
        error: 'EMAIL_RATE_LIMIT_EXCEEDED',
        remainingTime
      });
    }

    // Increment the counter
    attemptData.count++;
  } else {
    // First attempt for this email
    resetAttempts.set(email, { count: 1, resetTime: now + windowMs });
  }

  next();
};

/**
 * Reset rate limit for an email (used after successful password reset)
 */
export const resetEmailRateLimit = (email: string) => {
  if (email) {
    resetAttempts.delete(email.toLowerCase());
    console.log(`✅ Password reset rate limit cleared for: ${email}`);
  }
};

/**
 * Get remaining attempts for an email
 */
export const getRemainingAttempts = (email: string): { remaining: number; resetTime?: number } => {
  const attemptData = resetAttempts.get(email.toLowerCase());
  
  if (!attemptData) {
    return { remaining: 3 };
  }

  const now = Date.now();
  if (now > attemptData.resetTime) {
    // Window expired, reset
    resetAttempts.delete(email.toLowerCase());
    return { remaining: 3 };
  }

  return {
    remaining: Math.max(0, 3 - attemptData.count),
    resetTime: attemptData.resetTime
  };
};
