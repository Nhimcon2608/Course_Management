import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';

// In-memory storage for API metrics (in production, use Redis or database)
interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: string;
}

interface EndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastRequest: Date;
  errorRate: number;
}

class ApiMetricsCollector {
  private metrics: ApiMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k requests

  addMetric(metric: ApiMetric) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(limit: number = 100): ApiMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  getEndpointStats(): EndpointStats[] {
    const statsMap = new Map<string, EndpointStats>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          endpoint: metric.endpoint,
          method: metric.method,
          totalRequests: 0,
          successRequests: 0,
          errorRequests: 0,
          averageResponseTime: 0,
          minResponseTime: Infinity,
          maxResponseTime: 0,
          lastRequest: metric.timestamp,
          errorRate: 0
        });
      }

      const stats = statsMap.get(key)!;
      stats.totalRequests++;
      
      if (metric.statusCode >= 200 && metric.statusCode < 400) {
        stats.successRequests++;
      } else {
        stats.errorRequests++;
      }

      stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);
      stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);
      stats.lastRequest = metric.timestamp > stats.lastRequest ? metric.timestamp : stats.lastRequest;
    });

    // Calculate averages and error rates
    statsMap.forEach(stats => {
      const endpointMetrics = this.metrics.filter(m => 
        m.method === stats.method && m.endpoint === stats.endpoint
      );
      
      stats.averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / endpointMetrics.length;
      stats.errorRate = (stats.errorRequests / stats.totalRequests) * 100;
      
      if (stats.minResponseTime === Infinity) {
        stats.minResponseTime = 0;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalRequests - a.totalRequests);
  }

  getOverallStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const allMetrics = this.metrics;
    const hourlyMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    const dailyMetrics = this.metrics.filter(m => m.timestamp >= oneDayAgo);

    const calculateStats = (metrics: ApiMetric[]) => ({
      totalRequests: metrics.length,
      successRequests: metrics.filter(m => m.statusCode >= 200 && m.statusCode < 400).length,
      errorRequests: metrics.filter(m => m.statusCode >= 400).length,
      averageResponseTime: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length : 0,
      errorRate: metrics.length > 0 ? (metrics.filter(m => m.statusCode >= 400).length / metrics.length) * 100 : 0
    });

    return {
      overall: calculateStats(allMetrics),
      hourly: calculateStats(hourlyMetrics),
      daily: calculateStats(dailyMetrics),
      lastUpdated: new Date().toISOString()
    };
  }

  getRecentErrors(limit: number = 50): ApiMetric[] {
    return this.metrics
      .filter(m => m.statusCode >= 400)
      .slice(-limit)
      .reverse();
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Global instance
export const apiMetricsCollector = new ApiMetricsCollector();

// Middleware function
export const apiMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture metrics
  res.end = function(chunk?: any, encoding?: any): any {
    const responseTime = Date.now() - startTime;
    const authReq = req as AuthRequest;

    // Create metric entry
    const metric: ApiMetric = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: authReq.user?.id
    };

    // Add error message for failed requests
    if (res.statusCode >= 400) {
      metric.error = `${res.statusCode} ${res.statusMessage}`;
    }

    // Add to collector
    apiMetricsCollector.addMetric(metric);

    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export default apiMetricsMiddleware;
