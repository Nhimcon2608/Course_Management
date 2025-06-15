'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { CreateOrderRequest } from '@/types';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, summary, isLoading: cartLoading } = useCartStore();
  const { createOrder, isLoading: orderLoading } = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<'zalopay' | 'cash' | 'bank_transfer'>('zalopay');
  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Vietnam'
  });
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }

    // Check email verification
    if (!user?.isEmailVerified) {
      toast.error('Please verify your email address before making a purchase', {
        icon: '📧',
        duration: 6000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #F59E0B'
        }
      });
      router.push('/auth/verify-email');
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    // Pre-fill billing address with user data
    if (user) {
      setBillingAddress(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || ''
      }));
    }
  }, [isAuthenticated, cart, user, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!billingAddress.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!billingAddress.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!billingAddress.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const orderData: CreateOrderRequest = {
        paymentMethod,
        billingAddress,
        notes: notes.trim() || undefined
      };

      const order = await createOrder(orderData);
      
      // Redirect to payment page
      router.push(`/orders/${order._id}/payment`);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Billing Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={billingAddress.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={billingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={billingAddress.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    City
                  </label>
                  <input
                    type="text"
                    value={billingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your city"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={billingAddress.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your address"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Payment Method
              </h2>
              
              <div className="space-y-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'zalopay' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('zalopay')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentMethod === 'zalopay'}
                      onChange={() => setPaymentMethod('zalopay')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <CreditCard className="h-5 w-5 ml-3 mr-2 text-blue-600" />
                    <span className="font-medium">ZaloPay</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-9 mt-1">
                    Pay securely with ZaloPay e-wallet
                  </p>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'bank_transfer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Building2 className="h-5 w-5 ml-3 mr-2 text-green-600" />
                    <span className="font-medium">Bank Transfer</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-9 mt-1">
                    Transfer directly to our bank account
                  </p>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Banknote className="h-5 w-5 ml-3 mr-2 text-yellow-600" />
                    <span className="font-medium">Cash Payment</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-9 mt-1">
                    Pay in cash at our office
                  </p>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                <FileText className="h-5 w-5 inline mr-2" />
                Order Notes (Optional)
              </h2>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions or notes for your order..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                <ShoppingBag className="h-5 w-5 inline mr-2" />
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={(item.course as any)._id} className="flex items-center space-x-3">
                    <img
                      src={(item.course as any).thumbnail || '/placeholder-course.jpg'}
                      alt={(item.course as any).title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(item.course as any).title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(summary?.totalAmount || 0)}</span>
                </div>
                
                {summary?.discountAmount && summary.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(summary.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(summary?.finalAmount || 0)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleCreateOrder}
                disabled={isProcessing || orderLoading}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing || orderLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
