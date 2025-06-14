'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Clock, Users, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import WishlistButton from '@/components/courses/WishlistButton';
import CartButton from '@/components/courses/CartButton';
import { useAuth } from '@/store/authStore';
import { useWishlist, useWishlistLoading, useWishlistActions } from '@/store/wishlistStore';
import { Course, User, Category } from '@/types';

const WishlistPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const wishlist = useWishlist();
  const isLoading = useWishlistLoading();
  const { fetchWishlist } = useWishlistActions();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/wishlist');
      return;
    }

    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, authLoading, fetchWishlist, router]);

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (duration: number | undefined | null) => {
    if (duration === undefined || duration === null || isNaN(duration)) {
      return 'N/A';
    }
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatRating = (rating: number | undefined | null) => {
    if (rating === undefined || rating === null || isNaN(rating)) {
      return '0.0';
    }
    return rating.toFixed(1);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              href="/courses"
              className="flex items-center text-gray-600 hover:text-primary-600 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Courses
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          </div>
          
          <div className="text-sm text-gray-600">
            {wishlist.length} course{wishlist.length !== 1 ? 's' : ''}
          </div>
        </div>

        {wishlist.length === 0 ? (
          /* Empty Wishlist */
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Save courses you're interested in and come back to them later.
            </p>
            <Link href="/courses">
              <Button size="lg">
                Explore Courses
              </Button>
            </Link>
          </div>
        ) : (
          /* Wishlist Items */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((course) => {
              const instructor = course.instructor as User;
              const category = course.category as Category;
              
              return (
                <div key={course._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Course Image */}
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <WishlistButton
                        courseId={course._id}
                        isInWishlist={true}
                        showText={false}
                        variant="ghost"
                        className="bg-white/90 hover:bg-white"
                      />
                    </div>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    {/* Category */}
                    <div className="text-sm text-primary-600 font-medium mb-2">
                      {category.name}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link 
                        href={`/courses/${course.slug || course._id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {course.title}
                      </Link>
                    </h3>

                    {/* Instructor */}
                    <p className="text-sm text-gray-600 mb-3">
                      by {instructor.name}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>{formatRating(course.rating)}</span>
                        <span className="ml-1">({course.totalRatings || 0})</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatDuration(course.duration)}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course.enrolledStudents || 0}</span>
                      </div>
                    </div>

                    {/* Level */}
                    <div className="mb-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-primary-600">
                          {formatPrice(course.price)}
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(course.originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      <CartButton
                        courseId={course._id}
                        price={course.price}
                        originalPrice={course.originalPrice}
                        size="sm"
                        showIcon={false}
                      >
                        Add to Cart
                      </CartButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
