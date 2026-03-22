'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  courses: Array<{
    course: {
      _id: string;
      title: string;
      thumbnail: string;
    };
    price: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentDetails: any;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

const AdminOrdersPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState<AdminOrder | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user, router, currentPage, searchTerm, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...filters
      });

      const response = await apiClient.get<{
        orders: AdminOrder[];
        pagination: any;
      }>(`/admin/orders?${searchParams.toString()}`);

      setOrders(response.data!.orders);
      setPagination(response.data!.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { status });
      toast.success('Order status updated successfully');
      fetchOrders();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.post(`/admin/orders/${orderId}/refund`);
      toast.success('Order refunded successfully');
      fetchOrders();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to refund order:', error);
      toast.error('Failed to refund order');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage orders, payments, and refunds</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Payment Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Payment Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading orders...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Courses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <CreditCard className="h-3 w-3 mr-1" />
                                {order.paymentMethod}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {order.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {order.user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.courses.length} course{order.courses.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.courses.slice(0, 2)
                              .filter(item => item.course && item.course.title)
                              .map(item => item.course.title)
                              .join(', ')}
                            {order.courses.length > 2 && ` +${order.courses.length - 2} more`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.finalAmount)}
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="text-sm text-gray-500">
                              -{formatCurrency(order.discountAmount)} discount
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          {order.completedAt && (
                            <div className="text-xs text-green-600">
                              Completed: {new Date(order.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === order._id ? null : order._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {showActionMenu === order._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                <div className="py-1">
                                  <button
                                    onClick={() => setShowOrderDetails(order)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </button>
                                  {order.status === 'pending' && (
                                    <button
                                      onClick={() => handleStatusUpdate(order._id, 'completed')}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Completed
                                    </button>
                                  )}
                                  {order.status === 'pending' && (
                                    <button
                                      onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel Order
                                    </button>
                                  )}
                                  {order.status === 'completed' && order.paymentStatus === 'paid' && (
                                    <button
                                      onClick={() => handleRefund(order._id)}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Process Refund
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * pagination.itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Order Details - #{showOrderDetails.orderNumber}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Name:</strong> {showOrderDetails.user.name}</p>
                      <p><strong>Email:</strong> {showOrderDetails.user.email}</p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(showOrderDetails.status)}`}>
                          {showOrderDetails.status}
                        </span>
                      </p>
                      <p><strong>Payment:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(showOrderDetails.paymentStatus)}`}>
                          {showOrderDetails.paymentStatus}
                        </span>
                      </p>
                      <p><strong>Method:</strong> {showOrderDetails.paymentMethod}</p>
                      <p><strong>Created:</strong> {new Date(showOrderDetails.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Courses */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Courses ({showOrderDetails.courses.length})</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {showOrderDetails.courses
                      .filter(item => item.course && item.course.title)
                      .map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center">
                          <img
                            src={item.course?.thumbnail || 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Course'}
                            alt={item.course?.title || 'Course'}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                          />
                          <span className="text-sm font-medium">{item.course?.title || 'Unknown Course'}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(showOrderDetails.totalAmount)}</span>
                    </div>
                    {showOrderDetails.discountAmount > 0 && (
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(showOrderDetails.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 font-medium text-lg border-t border-gray-200 mt-2 pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(showOrderDetails.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowOrderDetails(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
