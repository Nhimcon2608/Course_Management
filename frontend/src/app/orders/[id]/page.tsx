'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { 
  ArrowLeft,
  Calendar,
  CreditCard,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const { 
    currentOrder, 
    fetchOrder, 
    isLoading 
  } = useOrderStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (orderId) {
      fetchOrder(orderId);
    }
  }, [isAuthenticated, orderId, fetchOrder, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-2">Order #{currentOrder.orderNumber}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
                {getStatusIcon(currentOrder.status)}
                <span className="ml-2 capitalize">{currentOrder.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <Package className="h-5 w-5 inline mr-2" />
                Order Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Order Date
                  </label>
                  <p className="text-gray-900">{formatDate(currentOrder.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Payment Method
                  </label>
                  <p className="text-gray-900 capitalize">{currentOrder.paymentMethod}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <div className={`inline-flex items-center px-2 py-1 rounded text-sm ${getStatusColor(currentOrder.paymentStatus)}`}>
                    {getStatusIcon(currentOrder.paymentStatus)}
                    <span className="ml-1 capitalize">{currentOrder.paymentStatus}</span>
                  </div>
                </div>

                {currentOrder.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completed Date
                    </label>
                    <p className="text-gray-900">{formatDate(currentOrder.completedAt)}</p>
                  </div>
                )}
              </div>

              {currentOrder.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Order Notes
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{currentOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Billing Address */}
            {currentOrder.billingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  <User className="h-5 w-5 inline mr-2" />
                  Billing Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name
                    </label>
                    <p className="text-gray-900">{currentOrder.billingAddress.fullName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900">{currentOrder.billingAddress.email}</p>
                  </div>

                  {currentOrder.billingAddress.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone
                      </label>
                      <p className="text-gray-900">{currentOrder.billingAddress.phone}</p>
                    </div>
                  )}

                  {currentOrder.billingAddress.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Address
                      </label>
                      <p className="text-gray-900">
                        {currentOrder.billingAddress.address}
                        {currentOrder.billingAddress.city && `, ${currentOrder.billingAddress.city}`}
                        {currentOrder.billingAddress.country && `, ${currentOrder.billingAddress.country}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Courses Purchased
              </h2>
              
              <div className="space-y-4">
                {currentOrder.courses.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.thumbnail || '/placeholder-course.jpg'}
                      alt={item.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Instructor: {item.instructor}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentOrder.paymentStatus === 'paid' && (
                      <button
                        onClick={() => router.push(`/courses/${item.course}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Access Course
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(currentOrder.subtotal)}</span>
                </div>
                
                {currentOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(currentOrder.discountAmount)}</span>
                  </div>
                )}

                {currentOrder.couponCode && (
                  <div className="flex justify-between text-sm">
                    <span>Coupon</span>
                    <span className="font-medium">{currentOrder.couponCode}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(currentOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {currentOrder.paymentStatus === 'pending' && (
                  <button
                    onClick={() => router.push(`/orders/${currentOrder._id}/payment`)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Complete Payment
                  </button>
                )}

                {currentOrder.paymentStatus === 'paid' && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Access Courses
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
