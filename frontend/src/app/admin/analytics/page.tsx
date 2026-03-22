'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/services/adminApi';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Server,
  Database,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'courses' | 'system'>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

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

    fetchAnalytics();
  }, [isAuthenticated, user, router, activeTab, dateRange, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period,
        type: activeTab
      });

      if (!response || !response.analytics) {
        throw new Error('No analytics data received from server');
      }

      setAnalyticsData(response.analytics);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load analytics data';
      toast.error(errorMessage);
      setAnalyticsData(null); // Clear any existing data
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: BarChart3 },
    { id: 'revenue' as const, name: 'Revenue', icon: DollarSign },
    { id: 'users' as const, name: 'Users', icon: Users },
    { id: 'courses' as const, name: 'Courses', icon: BookOpen },
    { id: 'system' as const, name: 'System', icon: Server }
  ];

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAnalytics}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading analytics data...</p>
            </div>
          ) : !analyticsData ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <div className="text-red-600 mb-4">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium">No Analytics Data Available</h3>
              </div>
              <p className="text-red-700 mb-4">
                Unable to load analytics data. This could be due to:
              </p>
              <ul className="text-red-600 text-sm mb-4 space-y-1">
                <li>• Database connection issues</li>
                <li>• No data available for the selected period</li>
                <li>• Server configuration problems</li>
              </ul>
              <button
                onClick={fetchAnalytics}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && analyticsData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analyticsData.overview?.totalUsers || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          +{formatNumber(analyticsData.trends?.newUsers || 0)} this period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Courses</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analyticsData.overview?.totalCourses || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          +{formatNumber(analyticsData.trends?.newCourses || 0)} this period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Activity className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(analyticsData.overview?.totalOrders || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          +{formatNumber(analyticsData.trends?.newOrders || 0)} this period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(analyticsData.overview?.totalRevenue || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Growth trend
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === 'revenue' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
                      {analyticsData.paymentMethods && analyticsData.paymentMethods.length > 0 ? (
                        <div className="space-y-3">
                          {analyticsData.paymentMethods.map((method: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">{method._id || 'Unknown'}</span>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(method.revenue || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {method.count || 0} orders
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No payment method data available</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Payment method breakdown will appear here once you have completed orders
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Instructors</h3>
                      <div className="space-y-3">
                        {analyticsData.topInstructors?.slice(0, 5).map((instructor: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {instructor.instructor.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {instructor.courseCount} courses
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(instructor.revenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {instructor.enrollments} enrollments
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution</h3>
                      <div className="space-y-3">
                        {analyticsData.roleDistribution?.map((role: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600 capitalize">{role._id}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">{role.count}</div>
                              <div className="text-xs text-gray-500">
                                {role.active} active, {role.verified} verified
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Users</span>
                          <span className="text-sm font-medium">
                            {analyticsData.engagementMetrics?.totalUsers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Users</span>
                          <span className="text-sm font-medium">
                            {analyticsData.engagementMetrics?.activeUsers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Orders/User</span>
                          <span className="text-sm font-medium">
                            {(analyticsData.engagementMetrics?.averageOrdersPerUser || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Spent/User</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(analyticsData.engagementMetrics?.averageSpentPerUser || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Database Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Users</span>
                          <span className="text-sm font-medium">
                            {formatNumber(analyticsData.database?.collections?.users || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Courses</span>
                          <span className="text-sm font-medium">
                            {formatNumber(analyticsData.database?.collections?.courses || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Orders</span>
                          <span className="text-sm font-medium">
                            {formatNumber(analyticsData.database?.collections?.orders || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Categories</span>
                          <span className="text-sm font-medium">
                            {formatNumber(analyticsData.database?.collections?.categories || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Response Time</span>
                          <span className="text-sm font-medium">
                            {analyticsData.performance?.averageResponseTime || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Uptime</span>
                          <span className="text-sm font-medium text-green-600">
                            {analyticsData.performance?.uptime || '99.9%'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Memory Usage</span>
                          <span className="text-sm font-medium">
                            {analyticsData.performance?.memoryUsage || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">CPU Usage</span>
                          <span className="text-sm font-medium">
                            {analyticsData.performance?.cpuUsage || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Error Logs</h3>
                      <div className="space-y-3">
                        {analyticsData.errorLogs?.map((log: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className={`text-sm font-medium ${
                              log.level === 'error' ? 'text-red-600' : 
                              log.level === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">{log.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
