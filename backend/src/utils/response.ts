import { Response } from 'express';
import { ApiResponse } from '@/types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(pagination && { pagination })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  data?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any
): Response => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};
