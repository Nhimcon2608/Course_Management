'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Star, Clock, ExternalLink } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  enrolledStudents: number;
  rating: number;
  totalRatings: number;
  isPublished: boolean;
  category: {
    _id: string;
    name: string;
  };
  instructor: {
    _id: string;
    name: string;
  };
}

const TestCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        if (data.success && data.data) {
          setCourses(data.data.courses || []);
        } else {
          setError('Failed to load courses');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Courses</h1>
          <p className="text-gray-600 mb-6">
            Available published courses for testing. Click on any course to view its details.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Link
                href="/courses"
                className="flex items-center text-blue-700 hover:text-blue-900"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse All Courses
              </Link>
              <Link
                href="/instructor/courses"
                className="flex items-center text-blue-700 hover:text-blue-900"
              >
                <Users className="w-4 h-4 mr-2" />
                Instructor Dashboard
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center text-blue-700 hover:text-blue-900"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Login as Instructor
              </Link>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">There are no published courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Image */}
                <div className="aspect-video bg-gray-200">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#3B82F6"/>
                          <text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" text-anchor="middle" dy=".3em">Course</text>
                        </svg>
                      `)}`;
                    }}
                  />
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Category and Level */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-blue-600 font-medium">
                      {course.category.name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.shortDescription}
                  </p>

                  {/* Instructor */}
                  <p className="text-sm text-gray-500 mb-4">
                    by {course.instructor.name}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{course.rating.toFixed(1)}</span>
                      <span className="ml-1">({course.totalRatings})</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{course.enrolledStudents}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration}h</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(course.price)}
                    </span>
                    <Link
                      href={`/courses/${course._id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>

                  {/* Course ID for testing */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-mono">
                      ID: {course._id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Testing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Instructor Login</h4>
              <p>Email: instructor@example.com</p>
              <p>Password: 123456</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Student Login</h4>
              <p>Email: student@example.com</p>
              <p>Password: 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCoursesPage;
