'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const { 
    currentOrder, 
    fetchOrder, 
    createZaloPayPayment, 
    checkPaymentStatus,
    isLoading 
  } = useOrderStore();
  const { isAuthenticated } = useAuthStore();

  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (orderId) {
      fetchOrder(orderId);
    }
  }, [isAuthenticated, orderId, fetchOrder, router]);

  useEffect(() => {
    // Auto-check payment status for processing payments
    if (currentOrder?.paymentStatus === 'processing') {
      const interval = setInterval(() => {
        handleCheckStatus();
      }, 10000); // Check every 10 seconds

      setStatusCheckInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  }, [currentOrder?.paymentStatus]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleCreateZaloPayPayment = async () => {
    if (!currentOrder) return;

    setIsCreatingPayment(true);
    try {
      const paymentData = await createZaloPayPayment(currentOrder._id);
      setPaymentUrl(paymentData.orderUrl);
      
      // Open payment URL in new tab
      window.open(paymentData.orderUrl, '_blank');
      
      toast.success('Payment link opened in new tab');
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!currentOrder) return;

    setIsCheckingStatus(true);
    try {
      const statusData = await checkPaymentStatus(currentOrder._id);
      
      if (statusData.paymentStatus === 'paid') {
        toast.success('Payment completed successfully!');
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusIcon = () => {
    switch (currentOrder?.paymentStatus) {
      case 'paid':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'processing':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <CreditCard className="h-16 w-16 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (currentOrder?.paymentStatus) {
      case 'paid':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully. You can now access your courses.',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support.',
          color: 'text-red-600'
        };
      case 'processing':
        return {
          title: 'Payment Processing',
          message: 'Your payment is being processed. Please wait or check your ZaloPay app.',
          color: 'text-yellow-600'
        };
      default:
        return {
          title: 'Payment Required',
          message: 'Please complete your payment to access your courses.',
          color: 'text-blue-600'
        };
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

  const statusInfo = getStatusMessage();

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
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600 mt-2">Order #{currentOrder.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              {getStatusIcon()}
              
              <h2 className={`text-2xl font-bold mt-4 mb-2 ${statusInfo.color}`}>
                {statusInfo.title}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {statusInfo.message}
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                {currentOrder.paymentStatus === 'pending' && currentOrder.paymentMethod === 'zalopay' && (
                  <button
                    onClick={handleCreateZaloPayPayment}
                    disabled={isCreatingPayment}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay with ZaloPay
                      </>
                    )}
                  </button>
                )}

                {paymentUrl && (
                  <button
                    onClick={() => window.open(paymentUrl, '_blank')}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 flex items-center justify-center"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Open Payment Link
                  </button>
                )}

                {currentOrder.paymentStatus === 'processing' && (
                  <button
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus}
                    className="w-full bg-yellow-600 text-white py-3 px-6 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Check Payment Status
                      </>
                    )}
                  </button>
                )}

                {currentOrder.paymentStatus === 'paid' && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700"
                  >
                    Access Your Courses
                  </button>
                )}

                {currentOrder.paymentStatus === 'failed' && currentOrder.paymentMethod === 'zalopay' && (
                  <button
                    onClick={handleCreateZaloPayPayment}
                    disabled={isCreatingPayment}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating Payment...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </button>
                )}
              </div>

              {/* Auto-refresh notice */}
              {currentOrder.paymentStatus === 'processing' && (
                <p className="text-sm text-gray-500 mt-4">
                  Payment status will be checked automatically every 10 seconds
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                {currentOrder.courses.map((item) => (
                  <div key={item.course} className="flex items-center space-x-3">
                    <img
                      src={item.thumbnail || '/placeholder-course.jpg'}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
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

                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(currentOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{currentOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Status:</span>
                    <span className="capitalize">{currentOrder.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="capitalize">{currentOrder.paymentStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
