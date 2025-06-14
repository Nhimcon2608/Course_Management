'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Award,
  Globe,
  Play,
  ChevronRight,
  Download,
  CheckCircle,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CartButton from '@/components/courses/CartButton';
import WishlistButton from '@/components/courses/WishlistButton';
import SocialShare from '@/components/courses/SocialShare';
import { courseApi, Course, Review } from '@/services/api';
import { useAuth } from '@/store/authStore';

const CourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>('overview');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const response = await courseApi.getCourse(params?.id as string);
        
        if (response.success && response.data) {
          setCourse(response.data.course);
          setReviews(response.data.reviews);
          setRelatedCourses(response.data.relatedCourses);
          setIsEnrolled(response.data.isEnrolled);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchCourseData();
    }
  }, [params?.id]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await courseApi.enrollInCourse(course!._id);
      
      if (response.success) {
        setIsEnrolled(true);
        // TODO: Show success message
        console.log('Enrolled successfully');
      }
    } catch (err: any) {
      console.error('Error enrolling:', err);
      // TODO: Show error message
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                </div>
              </div>
              <div>
                <div className="h-64 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/courses"
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/courses" className="hover:text-primary-600">Courses</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/categories/${course.category._id}`} className="hover:text-primary-600">
              {course.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              {/* Instructor Preview Notice */}
              {user?.role === 'instructor' && !course.isPublished && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Instructor Preview Mode
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        You are viewing your unpublished course. Students cannot see this course until you publish it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                  course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
                <span className="text-sm text-gray-500">in {course.category.name}</span>
                {course.featured && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    Featured
                  </span>
                )}
                {!course.isPublished && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    Draft
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{course.shortDescription}</p>
              
              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {renderStars(course.rating)}
                  </div>
                  <span className="font-medium">{course.rating}</span>
                  <span className="ml-1">({course.totalRatings.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.enrolledStudents.toLocaleString()} students</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{course.duration} hours</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{course.totalLessons || course.lessons.length} lessons</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  <span className="capitalize">{course.language}</span>
                </div>
                {course.certificate && (
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    <span>Certificate</span>
                  </div>
                )}
              </div>
            </div>

            {/* Course Image */}
            <div className="mb-8">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#3B82F6"/>
                        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">Course</text>
                      </svg>
                    `)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'curriculum', label: 'Curriculum' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'instructor', label: 'Instructor' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About this course</h3>
                    <div className="prose max-w-none text-gray-600">
                      {course.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {course.whatYouWillLearn.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll learn</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.whatYouWillLearn.map((item, index) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {course.requirements.map((requirement, index) => (
                          <li key={index}>{requirement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Course Content ({course.lessons.length} lessons)
                  </h3>
                  <div className="space-y-3">
                    {course.lessons.map((lesson, index) => (
                      <div key={lesson._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-3">{lesson.order}.</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {lesson.isPreview && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Preview
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatDuration(lesson.duration)}
                            </span>
                            <Play className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Student Reviews ({course.totalRatings})
                  </h3>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {review.user.avatar ? (
                              <img
                                src={review.user.avatar}
                                alt={review.user.name}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center hidden">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instructor' && (
                <div>
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      {course.instructor?.avatar ? (
                        <img
                          src={course.instructor.avatar}
                          alt={course.instructor?.name || 'Instructor'}
                          className="w-24 h-24 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {course.instructor?.name || 'Unknown Instructor'}
                      </h3>
                      {course.instructor?.bio && (
                        <p className="text-gray-700 mb-4">{course.instructor.bio}</p>
                      )}
                      <div className="text-sm text-gray-600">
                        <p>Email: {course.instructor?.email || 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">${course.price}</span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">${course.originalPrice}</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        {course.discountPercentage}% off
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Enroll/Cart Button */}
              <div className="mb-6">
                {user?.role === 'instructor' && !course.isPublished ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      This is your unpublished course
                    </p>
                    <Link
                      href={`/instructor/courses/${course._id}/edit`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit Course
                    </Link>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <Link
                      href={`/courses/${course._id}/learn`}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium text-center block hover:bg-blue-700 transition-colors"
                    >
                      Start Learning
                    </Link>
                    <div className="text-center text-sm text-green-600 font-medium">
                      ✓ You are enrolled in this course
                    </div>
                  </div>
                ) : (
                  <CartButton
                    courseId={course._id}
                    price={course.price}
                    originalPrice={course.originalPrice}
                    className="w-full"
                    size="lg"
                  />
                )}
              </div>

              {/* Course Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{course.duration} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-medium">{course.lessons.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className="font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Language</span>
                  <span className="font-medium capitalize">{course.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Certificate</span>
                  <span className="font-medium">{course.certificate ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mb-6">
                <WishlistButton
                  courseId={course._id}
                  className="flex-1"
                  showText={true}
                />
                <SocialShare
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/courses/${course.slug || course._id}`}
                  title={course.title}
                  description={course.shortDescription}
                  image={course.thumbnail}
                  className="flex-1"
                />
              </div>

              {/* Tags */}
              {course.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Courses */}
        {relatedCourses.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCourses.map((relatedCourse) => (
                <Link
                  key={relatedCourse._id}
                  href={`/courses/${relatedCourse._id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <img
                    src={relatedCourse.thumbnail}
                    alt={relatedCourse.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#6B7280"/>
                          <text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {relatedCourse.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      by {relatedCourse.instructor?.name || 'Unknown Instructor'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(relatedCourse.rating)}
                        <span className="text-sm text-gray-600 ml-1">
                          ({relatedCourse.totalRatings})
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">${relatedCourse.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
