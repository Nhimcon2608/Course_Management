import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
  }),
  
  // Error file transport
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined file transport
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels: logLevels,
  transports,
});

// In-memory error storage for system health monitoring
interface ErrorLog {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
  stack?: string;
  metadata?: any;
  source: string;
  userId?: string;
  endpoint?: string;
  method?: string;
}

class ErrorCollector {
  private errors: ErrorLog[] = [];
  private readonly maxErrors = 1000; // Keep last 1000 errors

  addError(error: ErrorLog) {
    this.errors.push(error);
    
    // Keep only the last maxErrors entries
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  getErrors(limit: number = 100, level?: string): ErrorLog[] {
    let filteredErrors = this.errors;
    
    if (level) {
      filteredErrors = this.errors.filter(e => e.level === level);
    }
    
    return filteredErrors.slice(-limit).reverse();
  }

  getErrorStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const hourlyErrors = this.errors.filter(e => e.timestamp >= oneHourAgo);
    const dailyErrors = this.errors.filter(e => e.timestamp >= oneDayAgo);

    const groupByLevel = (errors: ErrorLog[]) => {
      const groups: { [key: string]: number } = {};
      errors.forEach(e => {
        groups[e.level] = (groups[e.level] || 0) + 1;
      });
      return groups;
    };

    return {
      total: this.errors.length,
      hourly: {
        count: hourlyErrors.length,
        byLevel: groupByLevel(hourlyErrors)
      },
      daily: {
        count: dailyErrors.length,
        byLevel: groupByLevel(dailyErrors)
      },
      byLevel: groupByLevel(this.errors),
      lastUpdated: new Date().toISOString()
    };
  }

  clearErrors() {
    this.errors = [];
  }
}

// Global error collector instance
export const errorCollector = new ErrorCollector();

// Enhanced logger with error collection
const enhancedLogger = {
  error: (message: string, metadata?: any) => {
    logger.error(message, metadata);
    
    errorCollector.addError({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      level: 'error',
      message,
      timestamp: new Date(),
      stack: metadata?.stack,
      metadata,
      source: 'application',
      userId: metadata?.userId,
      endpoint: metadata?.endpoint,
      method: metadata?.method
    });
  },
  
  warn: (message: string, metadata?: any) => {
    logger.warn(message, metadata);
    
    errorCollector.addError({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      level: 'warn',
      message,
      timestamp: new Date(),
      metadata,
      source: 'application',
      userId: metadata?.userId,
      endpoint: metadata?.endpoint,
      method: metadata?.method
    });
  },
  
  info: (message: string, metadata?: any) => {
    logger.info(message, metadata);
  },
  
  http: (message: string, metadata?: any) => {
    logger.http(message, metadata);
  },
  
  debug: (message: string, metadata?: any) => {
    logger.debug(message, metadata);
  }
};

export default enhancedLogger;
