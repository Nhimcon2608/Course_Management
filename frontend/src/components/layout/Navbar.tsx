'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, BookOpen, ShoppingCart, Heart, Menu, X, Package, GraduationCap, PlusCircle, Users, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useAuthActions } from '@/store/authStore';
import { useCartSummary } from '@/store/cartStore';
import { useAuthSync } from '@/hooks/useAuthSync';

const Navbar: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { logout } = useAuthActions();
  const cartSummary = useCartSummary();
  const router = useRouter();

  // Use auth sync hook to ensure state is synchronized
  useAuthSync();

  // Force update on auth changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [isAuthenticated, user]);

  // Listen for auth change events
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Navbar - Auth change event received');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully', {
        icon: '👋',
        duration: 3000
      });
      router.push('/');
    } catch (error) {
      toast.error('Logout failed', {
        icon: '❌',
        duration: 3000
      });
    }
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => {
                if (isAuthenticated && user?.role === 'admin') {
                  router.push('/admin/dashboard');
                } else if (isAuthenticated) {
                  router.push('/dashboard');
                } else {
                  router.push('/');
                }
              }}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Course Management
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/courses"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Categories
            </Link>

            {/* Instructor/Admin only navigation items */}
            {isAuthenticated && user && user.role !== 'student' && (
              <>
                <Link
                  href="/instructor/courses/create"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Course</span>
                </Link>
                <Link
                  href="/instructor/students"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>Students</span>
                </Link>
                <Link
                  href="/instructor/analytics"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
              </>
            )}

            <Link
              href="/about"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              About
            </Link>
          </div>

          {/* Right side - Auth & User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="text-gray-700 hover:text-primary-600 p-2 rounded-md transition-colors"
                  title="Wishlist"
                >
                  <Heart className="h-6 w-6" />
                </Link>

                {/* Shopping Cart */}
                <Link
                  href="/cart"
                  className="text-gray-700 hover:text-primary-600 p-2 rounded-md transition-colors relative"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartSummary && cartSummary.totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
                    </span>
                  )}
                </Link>

                <Link
                  href="/orders"
                  className="text-gray-700 hover:text-primary-600 p-2 rounded-md transition-colors"
                  title="My Orders"
                >
                  <Package className="h-6 w-6" />
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'User'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getUserInitials(user?.name || 'User')}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.name || 'User'}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{user?.email || 'No email'}</p>
                      </div>
                      
                      <Link
                        href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>

                      <Link
                        href="/learning"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        My Learning
                      </Link>

                      <Link
                        href="/wishlist"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        My Wishlist
                      </Link>

                      <Link
                        href="/cart"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Shopping Cart
                        {cartSummary && cartSummary.totalItems > 0 && (
                          <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                            {cartSummary.totalItems}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        My Orders
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Not authenticated - show login/register buttons */
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                href="/courses"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                href="/categories"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>

              {/* Instructor/Admin only navigation items for mobile */}
              {isAuthenticated && user && user.role !== 'student' && (
                <>
                  <Link
                    href="/instructor/courses/create"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Course</span>
                  </Link>
                  <Link
                    href="/instructor/students"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    <span>Students</span>
                  </Link>
                  <Link
                    href="/instructor/analytics"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}

              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>

              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/learning"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Learning
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cart
                  </Link>
                </div>
              )}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2 bg-primary-600 text-white rounded-md text-base font-medium hover:bg-primary-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
