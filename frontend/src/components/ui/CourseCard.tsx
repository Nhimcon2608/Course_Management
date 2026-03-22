'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Clock, ExternalLink } from 'lucide-react';

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug?: string;
    thumbnail: string;
    price: number;
    level: string;
    rating: number;
    totalRatings: number;
    enrolledStudents: number;
    duration: number;
    instructor: {
      name: string;
    };
    category: {
      name: string;
      _id: string;
    };
  };
  compact?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, compact = false }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const formatLevel = (level: string) => {
    const levelMap = {
      'beginner': 'Cơ bản',
      'intermediate': 'Trung cấp', 
      'advanced': 'Nâng cao'
    };
    return levelMap[level as keyof typeof levelMap] || level;
  };

  const courseUrl = course.slug 
    ? `http://localhost:3000/courses/${course.slug}`
    : `http://localhost:3000/courses/${course._id}`;

  const categoryUrl = `http://localhost:3000/categories/${course.category._id}`;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden bg-gray-100">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {!imageError ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-primary-600 text-xs font-medium">
                {course.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {formatLevel(course.level)}
            </span>
            <span className="font-semibold text-primary-600">
              {formatPrice(course.price)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{course.enrolledStudents}</span>
            </div>
          </div>
        </div>

        {/* Link */}
        <div className="flex-shrink-0">
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
            title="Xem khóa học"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative h-32 bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!imageError ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-primary-600 text-2xl font-bold">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Level Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
            {formatLevel(course.level)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span>Giảng viên: {course.instructor.name}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration}h</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{course.rating}</span>
              <span className="text-xs text-gray-500">({course.totalRatings})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            <span>{course.enrolledStudents} học viên</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(course.price)}
          </span>
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-full hover:bg-primary-700 transition-colors"
          >
            Xem chi tiết
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Category Link */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <a
            href={categoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
          >
            Danh mục: {course.category.name} →
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
