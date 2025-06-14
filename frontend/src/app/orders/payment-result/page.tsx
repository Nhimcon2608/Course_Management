'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  Home,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appTransId = searchParams.get('apptransid');
  const orderIdFromUrl = searchParams.get('orderId');

  const { 
    orders,
    fetchOrders,
    checkPaymentStatus,
    isLoading 
  } = useOrderStore();
  const { isAuthenticated } = useAuthStore();

  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (searchParams) {
      const allParams = Object.fromEntries(searchParams.entries());
      console.log('🔍 Payment result page loaded with params:', {
        appTransId,
        orderIdFromUrl,
        allParams
      });

      // Check ZaloPay status from URL params
      const zaloPayStatus = searchParams.get('status');
      const amount = searchParams.get('amount');
      const bankCode = searchParams.get('bankcode');

      // Set the status state
      setStatus(zaloPayStatus);

      console.log('💳 ZaloPay payment details:', {
        status: zaloPayStatus,
        amount,
        bankCode,
        appTransId
      });
    }

    // Fetch orders to find the one with matching ZaloPay transaction ID
    fetchOrders();
  }, [isAuthenticated, fetchOrders, router]);

  useEffect(() => {
    if (orders.length > 0 && !statusChecked) {
      console.log('🔍 Searching for order in', orders.length, 'orders');
      console.log('Search criteria:', { orderIdFromUrl, appTransId });

      let targetOrder = null;

      // First priority: Find by orderId from URL
      if (orderIdFromUrl) {
        targetOrder = orders.find(o => o._id === orderIdFromUrl);
        console.log('Search by orderId result:', targetOrder ? `Found ${targetOrder.orderNumber}` : 'Not found');
      }

      // Second priority: Find by ZaloPay transaction ID
      if (!targetOrder && appTransId) {
        targetOrder = orders.find(o =>
          o.paymentDetails?.zaloPayTransId === appTransId ||
          o.paymentDetails?.transactionId === appTransId
        );
        console.log('Search by appTransId result:', targetOrder ? `Found ${targetOrder.orderNumber}` : 'Not found');

        // Debug: Log all orders' transaction IDs
        console.log('All orders transaction IDs:', orders.map(o => ({
          orderNumber: o.orderNumber,
          zaloPayTransId: o.paymentDetails?.zaloPayTransId,
          transactionId: o.paymentDetails?.transactionId,
          paymentStatus: o.paymentStatus
        })));
      }

      // Third priority: Most recent pending order
      if (!targetOrder) {
        targetOrder = orders.find(o => o.paymentStatus === 'pending');
        console.log('Search by pending status result:', targetOrder ? `Found ${targetOrder.orderNumber}` : 'Not found');
      }

      if (targetOrder) {
        console.log('✅ Target order found:', targetOrder.orderNumber);
        setCurrentOrder(targetOrder);
        handleCheckStatus(targetOrder._id);
      } else {
        console.log('❌ No target order found');
      }
    }
  }, [orders, appTransId, orderIdFromUrl, statusChecked]);

  // Handle ZaloPay sandbox behavior
  useEffect(() => {
    if (status === '-377' && appTransId) {
      console.log('🔄 ZaloPay sandbox detected (status -377), auto-checking order status...');
      // In sandbox, status -377 means transaction not executed
      // But our callback simulation might have processed it
      setTimeout(() => {
        if (currentOrder) {
          handleCheckStatus(currentOrder._id);
        }
      }, 3000);
    } else if (status === '1' && appTransId) {
      // Status 1 means success, but still check order status
      console.log('✅ ZaloPay success status detected, checking order...');
      setTimeout(() => {
        if (currentOrder) {
          handleCheckStatus(currentOrder._id);
        }
      }, 2000);
    }
  }, [status, appTransId, currentOrder]);

  const handleCheckStatus = async (orderId: string) => {
    setIsCheckingStatus(true);
    setStatusChecked(true);

    try {
      console.log('🔄 Checking payment status for order:', orderId);
      const statusData = await checkPaymentStatus(orderId);
      console.log('Status check result:', statusData);

      // Update current order with new status
      setCurrentOrder((prev: any) => ({
        ...prev,
        paymentStatus: statusData.paymentStatus,
        status: statusData.orderStatus,
        completedAt: statusData.completedAt
      }));

      if (statusData.paymentStatus === 'paid') {
        toast.success('Payment completed successfully!');
      } else if (statusData.paymentStatus === 'failed') {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check payment status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleTestCallback = async () => {
    if (!appTransId) {
      toast.error('No transaction ID found');
      return;
    }

    try {
      console.log('🧪 Testing callback for transaction:', appTransId);

      const response = await fetch('/api/orders/zalopay/test-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ app_trans_id: appTransId })
      });

      const data = await response.json();
      console.log('Test callback result:', data);

      if (data.success) {
        toast.success('Test callback successful! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`Test callback failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Test callback error:', error);
      toast.error('Test callback failed');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusIcon = () => {
    if (isCheckingStatus) {
      return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
    }

    switch (currentOrder?.paymentStatus) {
      case 'paid':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    if (isCheckingStatus) {
      return {
        title: 'Checking Payment Status...',
        message: 'Please wait while we verify your payment.',
        color: 'text-blue-600'
      };
    }

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
      case 'pending':
        const sandboxNote = status === '-377' ? ' (ZaloPay Sandbox: Use "Simulate Payment Success" button below)' : '';
        return {
          title: 'Payment Processing',
          message: `Your payment is still being processed. Please wait a moment.${sandboxNote}`,
          color: 'text-yellow-600'
        };
      default:
        const defaultSandboxNote = status === '-377' ? ' ZaloPay Sandbox detected - use the simulation button below.' : '';
        return {
          title: 'Payment Status Unknown',
          message: `We are checking your payment status. Please wait.${defaultSandboxNote}`,
          color: 'text-gray-600'
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Result</h1>
          {currentOrder && (
            <p className="text-gray-600 mt-2">Order #{currentOrder.orderNumber}</p>
          )}
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

              {/* Transaction Info */}
              {appTransId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Transaction ID:</strong> {appTransId}
                  </p>
                  {orderIdFromUrl && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Order ID:</strong> {orderIdFromUrl}
                    </p>
                  )}
                  <div className="mt-3 space-x-2">
                    <button
                      onClick={handleTestCallback}
                      className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      🧪 Simulate Payment Success
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      🔄 Refresh Status
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {currentOrder?.paymentStatus === 'pending' && (
                  <button
                    onClick={() => handleCheckStatus(currentOrder._id)}
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
                        Check Status Again
                      </>
                    )}
                  </button>
                )}

                {currentOrder?.paymentStatus === 'paid' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/orders/${currentOrder._id}`)}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700"
                    >
                      View Order Details
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700"
                    >
                      Access Your Courses
                    </button>
                    <button
                      onClick={() => router.push('/orders')}
                      className="w-full bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      View All Orders
                    </button>
                  </div>
                )}

                {currentOrder?.paymentStatus === 'failed' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/orders/${currentOrder._id}/payment`)}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700"
                    >
                      Try Payment Again
                    </button>
                    <button
                      onClick={() => router.push('/orders')}
                      className="w-full bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      View All Orders
                    </button>
                  </div>
                )}

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          {currentOrder && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {currentOrder.courses.map((item: any) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
