import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { JWTPayload } from '@/types';

interface TokenOptions {
  rememberMe?: boolean;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: JWTPayload, options: TokenOptions = {}): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = options.rememberMe ? '24h' : '15m';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: JWTPayload, options: TokenOptions = {}): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = options.rememberMe ? '30d' : '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = (user: { _id: string; email: string; role: string }, options: TokenOptions = {}) => {
  const payload: JWTPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload, options);
  const refreshToken = generateRefreshToken(payload, options);

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  return expiration.getTime() < Date.now();
};

/**
 * Set secure HTTP-only cookies for authentication
 */
export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string, rememberMe: boolean = false): void => {
  const accessTokenMaxAge = rememberMe ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000; // 24h or 15m
  const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30d or 7d

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: accessTokenMaxAge,
    path: '/'
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshTokenMaxAge,
    path: '/'
  });

  // Set remember me flag cookie (not HTTP-only, for frontend access)
  res.cookie('rememberMe', rememberMe.toString(), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshTokenMaxAge,
    path: '/'
  });
};

/**
 * Clear authentication cookies
 */
export const clearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  res.clearCookie('rememberMe', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

/**
 * Extract token from cookies or Authorization header
 */
export const extractToken = (req: any): string | null => {
  // Try to get token from cookies first
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback to Authorization header
  return extractTokenFromHeader(req.headers.authorization);
};
