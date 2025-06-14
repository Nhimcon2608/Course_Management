import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Store for tracking progressive delays
const delayStore = new Map<string, { attempts: number; lastAttempt: number }>();

// Progressive delay function
const getProgressiveDelay = (ip: string): number => {
  const now = Date.now();
  const record = delayStore.get(ip);
  
  if (!record) {
    delayStore.set(ip, { attempts: 1, lastAttempt: now });
    return 0;
  }
  
  // Reset if more than 15 minutes have passed
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    delayStore.set(ip, { attempts: 1, lastAttempt: now });
    return 0;
  }
  
  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  
  // Progressive delay: 1s, 2s, 4s, 8s, 16s (max)
  const delay = Math.min(Math.pow(2, record.attempts - 1) * 1000, 16000);
  
  return delay;
};

// Reset delay for successful login
export const resetProgressiveDelay = (ip: string): void => {
  delayStore.delete(ip);
};

// Login rate limiter with progressive delay
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler with progressive delay
  handler: async (req: Request, res: Response) => {
    const delay = getProgressiveDelay(req.ip || req.connection.remoteAddress || '');
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    res.status(429).json({
      error: 'Too many login attempts. Please wait before trying again.',
      retryAfter: Math.ceil(delay / 1000),
      nextAttemptIn: `${Math.ceil(delay / 1000)} seconds`
    });
  }
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: {
    error: 'Too many requests for this operation, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Account-specific rate limiter (for password reset, etc.)
export const accountRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each account to 3 requests per hour
  keyGenerator: (req: Request) => {
    // Use email or user ID as key instead of IP
    return req.body.email || (req as any).user?.id || req.ip || '';
  },
  message: {
    error: 'Too many requests for this account, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Cleanup old delay records periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = 15 * 60 * 1000; // 15 minutes
  
  for (const [ip, record] of delayStore.entries()) {
    if (now - record.lastAttempt > cutoff) {
      delayStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
