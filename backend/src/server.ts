// Setup module aliases for production
import 'module-alias/register';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '@/config/database';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { apiRateLimiter, loginRateLimiter } from '@/middleware/rateLimiter';
import { apiMetricsMiddleware } from '@/middleware/apiMetrics';
import swaggerSetup from '@/config/swagger';
import logger from '@/utils/logger';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import courseRoutes from '@/routes/courses';
import categoryRoutes from '@/routes/categories';
import cartRoutes from '@/routes/cart';
import wishlistRoutes from '@/routes/wishlist';
import reviewRoutes from '@/routes/reviews';
import couponRoutes from '@/routes/coupons';
import orderRoutes from '@/routes/orders';
import dashboardRoutes from '@/routes/dashboard';
import learningRoutes from '@/routes/learning';
import instructorRoutes from '@/routes/instructor';
import notificationRoutes from '@/routes/notifications';
import adminRoutes from '@/routes/admin';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Debug: Log environment loading
console.log('🔧 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'not set');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Simple CORS configuration for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

// Special logging middleware for ZaloPay callback
app.use('/api/orders/zalopay/callback', (req, _res, next) => {
  console.log('🔔 ZaloPay callback request received');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', req.query);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, path) => {
    // Set CORS headers for video files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Set proper headers for video files
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.avi') || path.endsWith('.mov') || path.endsWith('.wmv')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting - Disabled for development
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiRateLimiter);
  app.use('/api/auth/login', loginRateLimiter);
} else {
  console.log('🔓 Rate limiting disabled for development');
}

// Swagger documentation
swaggerSetup(app);

// API metrics middleware - track all API requests
app.use('/api', apiMetricsMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} - Updated with enrollment fix`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
