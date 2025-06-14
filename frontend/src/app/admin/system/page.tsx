'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api';
import {
  Server,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  Users,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  Download,
  Upload,
  Wifi,
  Shield,
  Settings,
  Terminal,
  FileText,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues?: string[] | null;
  uptime: number;
  responseTime: number;
  timestamp: string;
  dataSource: 'real';
  note: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    collections: {
      name: string;
      count: number;
      size: string;
    }[];
    indexes: number;
    connections: {
      current: number;
      available: number;
      totalCreated: number;
    } | number | string;
    totalSize?: string;
    indexSize?: string;
    storageSize?: string;
    version?: string;
    uptime?: number;
    opcounters?: any;
    network?: any;
    memory?: any;
    host?: string;
    process?: string;
    error?: string;
  };
  server: {
    cpu: {
      usage: string;
      cores: number;
      model: string;
      speed: number;
      loadAverage: number[];
    } | number | string; // Can be 'Unknown' for backward compatibility
    memory: {
      heap: {
        used: number;
        total: number;
        percentage: number;
      };
      rss: number;
      external: number;
      arrayBuffers: number;
      system: {
        total: number;
        free: number;
        used: number;
        percentage: number;
      };
    } | {
      used: number;
      total: number;
      percentage: number;
      rss?: number;
      external?: number;
    };
    disk: {
      available: boolean;
      reason?: string;
      used?: number;
      total?: number;
      percentage?: number;
    } | null;
    network?: {
      interfaces: {
        name: string;
        addresses: any[];
      }[];
    };
    system?: {
      platform: string;
      arch: string;
      nodeVersion: string;
      pid: number;
      ppid: number;
      uptime: number;
      hostname: string;
      osType: string;
      osRelease: string;
      osUptime: number;
    };
    // Legacy fields for backward compatibility
    load?: number[] | null;
    platform?: string;
    nodeVersion?: string;
    pid?: number;
  };
  api: {
    available: boolean;
    reason?: string;
    note?: string;
    overall?: {
      totalRequests: number;
      successRequests: number;
      errorRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    hourly?: {
      totalRequests: number;
      successRequests: number;
      errorRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    daily?: {
      totalRequests: number;
      successRequests: number;
      errorRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    endpoints?: {
      endpoint: string;
      method: string;
      totalRequests: number;
      successRequests: number;
      errorRequests: number;
      averageResponseTime: number;
      minResponseTime: number;
      maxResponseTime: number;
      lastRequest: string;
      errorRate: number;
    }[];
    recentRequests?: {
      endpoint: string;
      method: string;
      statusCode: number;
      responseTime: number;
      timestamp: string;
      userAgent?: string;
      ip?: string;
      userId?: string;
      error?: string;
    }[];
    recentErrors?: any[];
    lastUpdated: string;
    // Legacy fields for backward compatibility
    totalRequests?: number | string;
    errorRate?: number | string;
    averageResponseTime?: number | string;
  };
  errors: {
    available: boolean;
    reason?: string;
    note?: string;
    stats?: {
      total: number;
      hourly: {
        count: number;
        byLevel: { [key: string]: number };
      };
      daily: {
        count: number;
        byLevel: { [key: string]: number };
      };
      byLevel: { [key: string]: number };
      lastUpdated: string;
    };
    errors: {
      id: string;
      level: string;
      message: string;
      timestamp: string;
      stack?: string;
      metadata?: any;
      source: string;
      userId?: string;
      endpoint?: string;
      method?: string;
    }[];
    lastUpdated: string;
  };
}

const SystemPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 System Health useEffect triggered:', {
      isAuthenticated,
      user: user ? { id: user.id, role: user.role, email: user.email } : null,
      hasRouter: !!router
    });

    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'admin') {
      console.log('❌ User is not admin, redirecting to dashboard');
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    if (user && user.role === 'admin') {
      console.log('✅ Admin user authenticated, calling fetchSystemHealth');
      fetchSystemHealth();
    } else {
      console.log('⏳ Waiting for user data to load...');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSystemHealth();
      }, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching real system health data...');
      console.log('🔑 Current user:', user);
      console.log('🔐 Is authenticated:', isAuthenticated);

      // Test if we can reach the backend at all
      console.log('🌐 Testing backend connectivity...');
      console.log('🔧 API Client config:', {
        baseURL: apiClient.defaults?.baseURL,
        headers: apiClient.defaults?.headers
      });

      console.log('🚀 Making API request to /admin/system/health...');
      const response = await apiClient.get('/admin/system/health');
      console.log('✅ System health response received:', response);
      console.log('📊 Response data structure:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'No data',
        responseType: typeof response
      });

      // Ensure we only use real data from the response
      if (response.success && response.data) {
        setSystemHealth(response.data);
        console.log('📊 Real system health data loaded successfully');
      } else {
        console.warn('⚠️ Invalid response format:', response);
        throw new Error(`Invalid system health response format. Expected success=true and data object, got: ${JSON.stringify(response)}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch system health:', error);
      console.error('🔍 Detailed error analysis:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });

      let errorMessage = 'Failed to load system health data';
      if (error.response?.status === 404) {
        errorMessage = 'System health endpoint not found (404)';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied - admin privileges required (403)';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required (401)';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(`System Health Error: ${errorMessage}`);
      toast.error(`System Health Error: ${errorMessage}`);

      // Clear any existing data to prevent showing stale information
      setSystemHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
      case 'error':
      case 'disconnected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'server', name: 'Server', icon: Server },
    { id: 'api', name: 'API Health', icon: Wifi },
    { id: 'logs', name: 'Error Logs', icon: FileText }
  ];

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health & Monitoring</h1>
            <p className="text-gray-600">Monitor system performance and health metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Auto-refresh:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!autoRefresh}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
            <button
              onClick={() => {
                console.log('🔄 Manual refresh button clicked');
                fetchSystemHealth();
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                console.log('🧪 Test API call button clicked');
                console.log('🔑 Current auth state:', { isAuthenticated, user: user?.role });
                fetchSystemHealth();
              }}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              Test API
            </button>
          </div>
        </div>

        {/* System Status Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Status</p>
                  <div className={`flex items-center mt-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.status)}`}>
                    {getStatusIcon(systemHealth.status)}
                    <span className="ml-1 capitalize">{systemHealth.status}</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <div className={`flex items-center mt-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.database.status)}`}>
                    {getStatusIcon(systemHealth.database.status)}
                    <span className="ml-1 capitalize">{systemHealth.database.status}</span>
                  </div>
                </div>
                <Database className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatUptime(systemHealth.uptime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {systemHealth.responseTime}ms
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

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

        {/* Tab Content */}
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading system health data...</p>
          </div>
        ) : !systemHealth || error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900">System Health Data Unavailable</h3>
            <p className="text-red-700 mt-2">
              {error || 'Unable to retrieve real system health information.'}
            </p>
            <p className="text-red-600 mt-2 text-sm">
              <strong>Note:</strong> This system only displays real data - no mock or placeholder content is shown.
            </p>
            <button
              onClick={fetchSystemHealth}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Real Data Notice */}
                {systemHealth?.dataSource === 'real' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-sm text-blue-800">
                        <strong>Real Data:</strong> {systemHealth.note}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Server Metrics */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Metrics (Real Data)</h3>
                    <div className="space-y-4">
                      {/* CPU Usage - Real or Not Available */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Cpu className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm text-gray-600">CPU Usage</span>
                        </div>
                        <div className="flex items-center">
                          {(() => {
                            const cpu = systemHealth.server.cpu;
                            if (typeof cpu === 'object' && 'usage' in cpu) {
                              const usage = parseFloat(cpu.usage);
                              return (
                                <>
                                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${Math.min(usage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{cpu.usage}</span>
                                </>
                              );
                            } else if (typeof cpu === 'string' && cpu !== 'Unknown') {
                              const usage = parseFloat(cpu);
                              return (
                                <>
                                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${Math.min(usage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{cpu}%</span>
                                </>
                              );
                            } else {
                              return <span className="text-sm text-gray-500">No data available</span>;
                            }
                          })()}
                        </div>
                      </div>

                      {/* Memory Usage - Real Data */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MemoryStick className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm text-gray-600">Memory Usage (Heap)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((() => {
                                  const memory = systemHealth.server.memory;
                                  if (typeof memory === 'object' && 'heap' in memory) {
                                    return memory.heap.percentage;
                                  } else if (typeof memory === 'object' && 'percentage' in memory) {
                                    return memory.percentage;
                                  }
                                  return 0;
                                })(), 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                      {(() => {
                        const memory = systemHealth.server.memory;
                        if (typeof memory === 'object' && 'heap' in memory) {
                          return memory.heap.percentage.toFixed(1);
                        } else if (typeof memory === 'object' && 'percentage' in memory) {
                          return memory.percentage.toFixed(1);
                        }
                        return '0.0';
                      })()}%
                    </span>
                        </div>
                      </div>

                      {/* Disk Usage - Real Data or Not Available */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <HardDrive className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="text-sm text-gray-600">Disk Usage</span>
                        </div>
                        <div className="flex items-center">
                          {systemHealth.server.disk?.available ? (
                            <>
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${systemHealth.server.disk.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{systemHealth.server.disk.percentage.toFixed(1)}%</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {systemHealth.server.disk?.reason || 'No data available'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Heap Memory:</span>
                            <p className="font-medium">
                              {(() => {
                                const memory = systemHealth.server.memory;
                                if (typeof memory === 'object' && 'heap' in memory) {
                                  return `${formatBytes(memory.heap.used)} / ${formatBytes(memory.heap.total)}`;
                                } else if (typeof memory === 'object' && 'used' in memory && 'total' in memory) {
                                  return `${formatBytes(memory.used)} / ${formatBytes(memory.total)}`;
                                }
                                return 'No data available';
                              })()}
                            </p>
                            {(() => {
                              const memory = systemHealth.server.memory;
                              const rss = typeof memory === 'object' && 'rss' in memory ? memory.rss : null;
                              return rss ? <p className="text-xs text-gray-500">RSS: {formatBytes(rss)}</p> : null;
                            })()}
                          </div>
                          <div>
                            <span className="text-gray-600">System Info:</span>
                            <p className="font-medium">
                              Node.js {systemHealth.server.system?.nodeVersion || systemHealth.server.nodeVersion || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Platform: {systemHealth.server.system?.platform || systemHealth.server.platform || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              PID: {systemHealth.server.system?.pid || systemHealth.server.pid || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database Overview */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Overview (Real Data)</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Connection Status</span>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.database.status)}`}>
                          {getStatusIcon(systemHealth.database.status)}
                          <span className="ml-1 capitalize">{systemHealth.database.status}</span>
                        </div>
                      </div>

                      {systemHealth.database.error && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Error</span>
                          <span className="text-sm text-red-600">{systemHealth.database.error}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className="text-sm font-medium">{systemHealth.database.responseTime}ms</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Connections</span>
                        <span className="text-sm font-medium">
                          {(() => {
                            const connections = systemHealth.database.connections;
                            if (typeof connections === 'object' && 'current' in connections) {
                              return connections.current;
                            } else if (connections === 'Unknown') {
                              return 'No data available';
                            } else {
                              return connections;
                            }
                          })()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Collections</span>
                        <span className="text-sm font-medium">{systemHealth.database.collections.length}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Indexes</span>
                        <span className="text-sm font-medium">
                          {systemHealth.database.indexes === 0 ? 'No data available' : systemHealth.database.indexes}
                        </span>
                      </div>

                      {systemHealth.database.totalSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Database Size</span>
                          <span className="text-sm font-medium">{systemHealth.database.totalSize}</span>
                        </div>
                      )}

                      {systemHealth.database.indexSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Index Size</span>
                          <span className="text-sm font-medium">{systemHealth.database.indexSize}</span>
                        </div>
                      )}

                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Top Collections</h4>
                      <div className="space-y-1">
                        {systemHealth.database.collections.slice(0, 3).map((collection, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{collection.name}</span>
                            <span className="font-medium">{collection.count.toLocaleString()} docs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* API Health Summary */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">API Health Summary</h3>
                    {systemHealth.api.available ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Requests</span>
                          <span className="text-sm font-medium">
                            {(systemHealth.api.overall?.totalRequests || systemHealth.api.totalRequests || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Error Rate</span>
                          <span className={`text-sm font-medium ${(systemHealth.api.overall?.errorRate || systemHealth.api.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {(systemHealth.api.overall?.errorRate || systemHealth.api.errorRate || 0).toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Avg Response Time</span>
                          <span className="text-sm font-medium">
                            {(systemHealth.api.overall?.averageResponseTime || systemHealth.api.averageResponseTime || 0).toFixed(1)}ms
                          </span>
                        </div>

                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Endpoints</h4>
                          <div className="space-y-1">
                            {(systemHealth.api.endpoints || []).slice(0, 3).map((endpoint, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 truncate">{endpoint.method} {endpoint.endpoint}</span>
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${
                                    endpoint.errorRate < 5 ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                  <span className="font-medium">{endpoint.averageResponseTime.toFixed(1)}ms</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">API Metrics Not Available</h4>
                        <p className="text-sm text-gray-600 mb-2">{systemHealth.api.reason}</p>
                        <p className="text-xs text-gray-500">{systemHealth.api.note}</p>
                        <div className="mt-4 text-xs text-gray-400">
                          Last checked: {new Date(systemHealth.api.lastUpdated).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Errors */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
                    {systemHealth.errors.available ? (
                      systemHealth.errors.errors.length > 0 ? (
                        <div className="space-y-3">
                          {systemHealth.errors.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  error.level === 'error' ? 'bg-red-100 text-red-800' :
                                  error.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {error.level.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(error.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{error.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No recent errors</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Error Logs Not Available</h4>
                        <p className="text-sm text-gray-600 mb-2">{systemHealth.errors.reason}</p>
                        <p className="text-xs text-gray-500">{systemHealth.errors.note}</p>
                        <div className="mt-4 text-xs text-gray-400">
                          Last checked: {new Date(systemHealth.errors.lastUpdated).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection & Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Connection Status</span>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.database.status)}`}>
                          {getStatusIcon(systemHealth.database.status)}
                          <span className="ml-1 capitalize">{systemHealth.database.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className={`text-sm font-medium ${systemHealth.database.responseTime > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {systemHealth.database.responseTime}ms
                        </span>
                      </div>

                      {typeof systemHealth.database.connections === 'object' && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Connections</span>
                            <span className="text-sm font-medium">{systemHealth.database.connections.current}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Available Connections</span>
                            <span className="text-sm font-medium">{systemHealth.database.connections.available}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Created</span>
                            <span className="text-sm font-medium">{systemHealth.database.connections.totalCreated}</span>
                          </div>
                        </>
                      )}

                      {systemHealth.database.version && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">MongoDB Version</span>
                          <span className="text-sm font-medium">{systemHealth.database.version}</span>
                        </div>
                      )}

                      {systemHealth.database.host && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Host</span>
                          <span className="text-sm font-medium">{systemHealth.database.host}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Collections</span>
                        <span className="text-sm font-medium">{systemHealth.database.collections.length}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Indexes</span>
                        <span className="text-sm font-medium">{systemHealth.database.indexes}</span>
                      </div>

                      {systemHealth.database.totalSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Database Size</span>
                          <span className="text-sm font-medium">{systemHealth.database.totalSize}</span>
                        </div>
                      )}

                      {systemHealth.database.indexSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Index Size</span>
                          <span className="text-sm font-medium">{systemHealth.database.indexSize}</span>
                        </div>
                      )}

                      {systemHealth.database.storageSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Storage Size</span>
                          <span className="text-sm font-medium">{systemHealth.database.storageSize}</span>
                        </div>
                      )}

                      {systemHealth.database.uptime && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Database Uptime</span>
                          <span className="text-sm font-medium">{systemHealth.database.uptime}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collections Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Collections Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {systemHealth.database.collections.map((collection, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {collection.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {collection.count.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {collection.size}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Database Operations */}
                {systemHealth.database.opcounters && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Operations</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(systemHealth.database.opcounters).map(([operation, count]) => (
                        <div key={operation} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{(count as number).toLocaleString()}</div>
                          <div className="text-sm text-gray-600 capitalize">{operation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Server Tab */}
            {activeTab === 'server' && (
              <div className="space-y-6">
                {/* System Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Platform</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.platform || systemHealth.server.platform || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Architecture</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.arch || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Node.js Version</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.nodeVersion || systemHealth.server.nodeVersion || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hostname</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.hostname || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">OS Type</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.osType || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">OS Release</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.osRelease || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Process ID</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.pid || systemHealth.server.pid || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Parent Process ID</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.ppid || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Process Uptime</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.uptime ?
                            `${Math.floor(systemHealth.server.system.uptime / 3600)}h ${Math.floor((systemHealth.server.system.uptime % 3600) / 60)}m` :
                            'Unknown'
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">OS Uptime</span>
                        <span className="text-sm font-medium">
                          {systemHealth.server.system?.osUptime ?
                            `${Math.floor(systemHealth.server.system.osUptime / 86400)}d ${Math.floor((systemHealth.server.system.osUptime % 86400) / 3600)}h` :
                            'Unknown'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CPU Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {typeof systemHealth.server.cpu === 'object' && 'cores' in systemHealth.server.cpu && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">CPU Cores</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.cores}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">CPU Model</span>
                            <span className="text-sm font-medium text-right max-w-xs truncate">
                              {systemHealth.server.cpu.model}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">CPU Speed</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.speed} MHz</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Usage</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.usage}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      {typeof systemHealth.server.cpu === 'object' && 'loadAverage' in systemHealth.server.cpu && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Load Average (1m)</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.loadAverage[0]?.toFixed(2) || 'N/A'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Load Average (5m)</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.loadAverage[1]?.toFixed(2) || 'N/A'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Load Average (15m)</span>
                            <span className="text-sm font-medium">{systemHealth.server.cpu.loadAverage[2]?.toFixed(2) || 'N/A'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Memory Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700">Process Memory (Heap)</h4>
                      {(() => {
                        const memory = systemHealth.server.memory;
                        if (typeof memory === 'object' && 'heap' in memory) {
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Heap Used</span>
                                <span className="text-sm font-medium">{formatBytes(memory.heap.used)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Heap Total</span>
                                <span className="text-sm font-medium">{formatBytes(memory.heap.total)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Heap Usage</span>
                                <span className="text-sm font-medium">{memory.heap.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">RSS Memory</span>
                                <span className="text-sm font-medium">{formatBytes(memory.rss)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">External Memory</span>
                                <span className="text-sm font-medium">{formatBytes(memory.external)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Array Buffers</span>
                                <span className="text-sm font-medium">{formatBytes(memory.arrayBuffers)}</span>
                              </div>
                            </>
                          );
                        } else if (typeof memory === 'object' && 'used' in memory) {
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Memory Used</span>
                                <span className="text-sm font-medium">{formatBytes(memory.used)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Memory Total</span>
                                <span className="text-sm font-medium">{formatBytes(memory.total)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Memory Usage</span>
                                <span className="text-sm font-medium">{memory.percentage.toFixed(1)}%</span>
                              </div>
                              {memory.rss && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">RSS Memory</span>
                                  <span className="text-sm font-medium">{formatBytes(memory.rss)}</span>
                                </div>
                              )}
                            </>
                          );
                        }
                        return <div className="text-sm text-gray-500">Memory information not available</div>;
                      })()}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-700">System Memory</h4>
                      {(() => {
                        const memory = systemHealth.server.memory;
                        if (typeof memory === 'object' && 'system' in memory) {
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total System Memory</span>
                                <span className="text-sm font-medium">{formatBytes(memory.system.total)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Free System Memory</span>
                                <span className="text-sm font-medium">{formatBytes(memory.system.free)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Used System Memory</span>
                                <span className="text-sm font-medium">{formatBytes(memory.system.used)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">System Memory Usage</span>
                                <span className="text-sm font-medium">{memory.system.percentage.toFixed(1)}%</span>
                              </div>

                              {/* Memory Usage Progress Bar */}
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600">System Memory Usage</span>
                                  <span className="text-xs font-medium">{memory.system.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      memory.system.percentage > 90 ? 'bg-red-600' :
                                      memory.system.percentage > 70 ? 'bg-yellow-600' : 'bg-green-600'
                                    }`}
                                    style={{ width: `${Math.min(memory.system.percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </>
                          );
                        }
                        return <div className="text-sm text-gray-500">System memory information not available</div>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Network Information */}
                {systemHealth.server.network && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Interfaces</h3>
                    <div className="space-y-4">
                      {systemHealth.server.network.interfaces.map((iface, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-md font-medium text-gray-700 mb-2">{iface.name}</h4>
                          <div className="space-y-2">
                            {iface.addresses.map((addr, addrIndex) => (
                              <div key={addrIndex} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{addr.family} Address</span>
                                <span className="font-medium">{addr.address}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Health Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                {systemHealth.api.available ? (
                  <>
                    {/* API Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Requests</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.overall?.totalRequests || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Success Rate</span>
                            <span className="text-sm font-medium text-green-600">
                              {systemHealth.api.overall ?
                                ((systemHealth.api.overall.successRequests / systemHealth.api.overall.totalRequests) * 100).toFixed(1) : 0
                              }%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Error Rate</span>
                            <span className={`text-sm font-medium ${(systemHealth.api.overall?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {(systemHealth.api.overall?.errorRate || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Response Time</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.overall?.averageResponseTime || 0).toFixed(1)}ms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Hour</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Requests</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.hourly?.totalRequests || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Success Rate</span>
                            <span className="text-sm font-medium text-green-600">
                              {systemHealth.api.hourly && systemHealth.api.hourly.totalRequests > 0 ?
                                ((systemHealth.api.hourly.successRequests / systemHealth.api.hourly.totalRequests) * 100).toFixed(1) : 0
                              }%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Error Rate</span>
                            <span className={`text-sm font-medium ${(systemHealth.api.hourly?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {(systemHealth.api.hourly?.errorRate || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Response Time</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.hourly?.averageResponseTime || 0).toFixed(1)}ms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 24 Hours</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Requests</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.daily?.totalRequests || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Success Rate</span>
                            <span className="text-sm font-medium text-green-600">
                              {systemHealth.api.daily && systemHealth.api.daily.totalRequests > 0 ?
                                ((systemHealth.api.daily.successRequests / systemHealth.api.daily.totalRequests) * 100).toFixed(1) : 0
                              }%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Error Rate</span>
                            <span className={`text-sm font-medium ${(systemHealth.api.daily?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {(systemHealth.api.daily?.errorRate || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Response Time</span>
                            <span className="text-sm font-medium">
                              {(systemHealth.api.daily?.averageResponseTime || 0).toFixed(1)}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Endpoints */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Request</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(systemHealth.api.endpoints || []).map((endpoint, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {endpoint.endpoint}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {endpoint.method}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {endpoint.totalRequests.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`${endpoint.errorRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                                    {((endpoint.successRequests / endpoint.totalRequests) * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {endpoint.averageResponseTime.toFixed(1)}ms
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(endpoint.lastRequest).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent API Requests */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent API Requests</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(systemHealth.api.recentRequests || []).map((request, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(request.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    request.method === 'GET' ? 'bg-green-100 text-green-800' :
                                    request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                    request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                    request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {request.method}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {request.endpoint}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    request.statusCode >= 200 && request.statusCode < 300 ? 'bg-green-100 text-green-800' :
                                    request.statusCode >= 300 && request.statusCode < 400 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {request.statusCode}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`${request.responseTime > 1000 ? 'text-red-600' : request.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {request.responseTime}ms
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.userId || 'Anonymous'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="text-center py-12">
                      <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">API Metrics Not Available</h3>
                      <p className="text-sm text-gray-600 mb-2">{systemHealth.api.reason}</p>
                      <p className="text-xs text-gray-500">{systemHealth.api.note}</p>
                      <div className="mt-4 text-xs text-gray-400">
                        Last checked: {new Date(systemHealth.api.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Logs Tab */}
            {activeTab === 'errors' && (
              <div className="space-y-6">
                {systemHealth.errors.available ? (
                  <>
                    {/* Error Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Errors</span>
                            <span className="text-sm font-medium">{systemHealth.errors.stats?.total || 0}</span>
                          </div>
                          {systemHealth.errors.stats?.byLevel && Object.entries(systemHealth.errors.stats.byLevel).map(([level, count]) => (
                            <div key={level} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{level}</span>
                              <span className={`text-sm font-medium ${
                                level === 'error' ? 'text-red-600' :
                                level === 'warn' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Hour</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Errors</span>
                            <span className="text-sm font-medium">{systemHealth.errors.stats?.hourly.count || 0}</span>
                          </div>
                          {systemHealth.errors.stats?.hourly.byLevel && Object.entries(systemHealth.errors.stats.hourly.byLevel).map(([level, count]) => (
                            <div key={level} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{level}</span>
                              <span className={`text-sm font-medium ${
                                level === 'error' ? 'text-red-600' :
                                level === 'warn' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 24 Hours</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Errors</span>
                            <span className="text-sm font-medium">{systemHealth.errors.stats?.daily.count || 0}</span>
                          </div>
                          {systemHealth.errors.stats?.daily.byLevel && Object.entries(systemHealth.errors.stats.daily.byLevel).map(([level, count]) => (
                            <div key={level} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{level}</span>
                              <span className={`text-sm font-medium ${
                                level === 'error' ? 'text-red-600' :
                                level === 'warn' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Error Logs */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Error Logs</h3>
                      {systemHealth.errors.errors.length > 0 ? (
                        <div className="space-y-4">
                          {systemHealth.errors.errors.map((error, index) => (
                            <div key={error.id || index} className={`p-4 rounded-lg border-l-4 ${
                              error.level === 'error' ? 'bg-red-50 border-red-400' :
                              error.level === 'warn' ? 'bg-yellow-50 border-yellow-400' :
                              'bg-blue-50 border-blue-400'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                      error.level === 'error' ? 'bg-red-100 text-red-800' :
                                      error.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {error.level.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(error.timestamp).toLocaleString()}
                                    </span>
                                    {error.source && (
                                      <span className="ml-2 text-xs text-gray-400">
                                        [{error.source}]
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{error.message}</p>

                                  {error.endpoint && (
                                    <div className="text-xs text-gray-500 mb-1">
                                      <span className="font-medium">Endpoint:</span> {error.method} {error.endpoint}
                                    </div>
                                  )}

                                  {error.userId && (
                                    <div className="text-xs text-gray-500 mb-1">
                                      <span className="font-medium">User ID:</span> {error.userId}
                                    </div>
                                  )}

                                  {error.stack && (
                                    <details className="mt-2">
                                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                        Show Stack Trace
                                      </summary>
                                      <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                                        {error.stack}
                                      </pre>
                                    </details>
                                  )}

                                  {error.metadata && (
                                    <details className="mt-2">
                                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                        Show Metadata
                                      </summary>
                                      <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(error.metadata, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Errors</h4>
                          <p className="text-sm text-gray-600">Your system is running smoothly!</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Logs Not Available</h3>
                      <p className="text-sm text-gray-600 mb-2">{systemHealth.errors.reason}</p>
                      <p className="text-xs text-gray-500">{systemHealth.errors.note}</p>
                      <div className="mt-4 text-xs text-gray-400">
                        Last checked: {new Date(systemHealth.errors.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemPage;
