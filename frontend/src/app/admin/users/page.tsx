'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi, AdminUser, PaginationResponse } from '@/services/adminApi';
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  User,
  GraduationCap,
  Mail,
  MailX,
  Eye,
  Edit,
  Trash2,
  Users,
  UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CreateUserModal from '@/components/admin/CreateUserModal';
import EditUserModal from '@/components/admin/EditUserModal';

const AdminUsersPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse<AdminUser>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isEmailVerified: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState<AdminUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

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

    fetchUsers();
  }, [isAuthenticated, user, router, currentPage, searchTerm, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        role: filters.role || undefined,
        isEmailVerified: filters.isEmailVerified ? filters.isEmailVerified === 'true' : undefined,
        isActive: filters.isActive ? filters.isActive === 'true' : undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId);
      toast.success('User status updated');
      fetchUsers();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await adminApi.createUser(userData);
      toast.success('User created successfully');
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      await adminApi.updateUserProfile(userId, userData);
      toast.success('User updated successfully');
      setShowEditUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string, force = false) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteUser(userId, force);
      toast.success('User deleted successfully');
      setShowActionMenu(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      if (error.response?.data?.message?.includes('force delete')) {
        if (confirm(error.response.data.message + ' Do you want to force delete?')) {
          handleDeleteUser(userId, true);
        }
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleBulkOperation = async (operation: 'delete' | 'activate' | 'deactivate' | 'changeRole', data?: any) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    if (!confirm(`Are you sure you want to ${operation} ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      await adminApi.bulkUserOperations({
        operation,
        userIds: selectedUsers,
        data
      });
      toast.success(`Bulk ${operation} completed successfully`);
      setSelectedUsers([]);
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      toast.error('Failed to perform bulk operation');
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'instructor':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      instructor: 'bg-blue-100 text-blue-800',
      student: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.student;
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            {selectedUsers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedUsers.length})
                </button>

                {showBulkActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      <button
                        onClick={() => handleBulkOperation('activate')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Activate Users
                      </button>
                      <button
                        onClick={() => handleBulkOperation('deactivate')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Deactivate Users
                      </button>
                      <button
                        onClick={() => handleBulkOperation('changeRole', { role: 'student' })}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Make Students
                      </button>
                      <button
                        onClick={() => handleBulkOperation('changeRole', { role: 'instructor' })}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Make Instructors
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleBulkOperation('delete')}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete Users
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={filters.isEmailVerified}
                onChange={(e) => handleFilterChange('isEmailVerified', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Verification</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>

              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statistics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                {user.isEmailVerified ? (
                                  <Mail className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <MailX className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRoleIcon(user.role)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isEmailVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>Courses: {user.stats.coursesEnrolled}</div>
                            <div>Orders: {user.stats.totalOrders}</div>
                            <div>Spent: {formatCurrency(user.stats.totalSpent)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === user._id ? null : user._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {showActionMenu === user._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleRoleUpdate(user._id, 'student')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    disabled={user.role === 'student'}
                                  >
                                    Make Student
                                  </button>
                                  <button
                                    onClick={() => handleRoleUpdate(user._id, 'instructor')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    disabled={user.role === 'instructor'}
                                  >
                                    Make Instructor
                                  </button>
                                  <button
                                    onClick={() => handleRoleUpdate(user._id, 'admin')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    disabled={user.role === 'admin'}
                                  >
                                    Make Admin
                                  </button>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => setShowEditUser(user)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                  </button>
                                  <button
                                    onClick={() => handleStatusToggle(user._id)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {user.isActive ? (
                                      <UserX className="h-4 w-4 mr-2" />
                                    ) : (
                                      <UserCheck className="h-4 w-4 mr-2" />
                                    )}
                                    {user.isActive ? 'Deactivate' : 'Activate'} User
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </button>
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

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onSubmit={handleCreateUser}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={!!showEditUser}
          user={showEditUser}
          onClose={() => setShowEditUser(null)}
          onSubmit={handleUpdateUser}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
