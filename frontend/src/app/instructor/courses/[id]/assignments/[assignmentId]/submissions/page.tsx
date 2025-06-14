'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import SubmissionsList from '@/components/instructor/SubmissionsList';
import SubmissionModal from '@/components/instructor/SubmissionModal';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  totalPoints: number;
  passingScore: number;
  deadline?: string;
  timeLimit?: number;
  attempts: number;
  isPublished: boolean;
  questions: any[];
}

interface Course {
  _id: string;
  title: string;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  score: number;
  maxScore: number;
  percentage: number;
  status: 'submitted' | 'graded' | 'returned' | 'draft';
  attemptNumber: number;
  timeSpent: number;
  submittedAt: string;
  isLate: boolean;
  answers: any[];
}

interface Statistics {
  totalSubmissions: number;
  averageScore: number;
  averagePercentage: number;
  maxScore: number;
  minScore: number;
  passCount: number;
  passRate: number;
  lateCount: number;
  completionRate: number;
}

interface SubmissionsData {
  assignment: Assignment;
  course: Course;
  submissions: Submission[];
  statistics: Statistics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [data, setData] = useState<SubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    minScore: '',
    maxScore: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'instructor') {
      router.push('/auth/login');
      return;
    }
    
    fetchSubmissions();
  }, [isAuthenticated, user, router, params, filters, sortBy, sortOrder, currentPage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await fetch(
        `/api/instructor/courses/${params?.id}/assignments/${params?.assignmentId}/submissions?${queryParams}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch submissions');
      }

      setData(result.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleGradeUpdate = async (submissionId: string, gradeData: any) => {
    try {
      const response = await fetch(
        `/api/instructor/courses/${params?.id}/assignments/${params?.assignmentId}/submissions/${submissionId}/grade`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(gradeData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update grade');
      }

      toast.success('Grade updated successfully');
      
      // Refresh submissions data
      await fetchSubmissions();
      
      // Close modal
      setShowSubmissionModal(false);
      setSelectedSubmission(null);
      
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'text-green-600 bg-green-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      case 'returned':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAssignmentStatus = () => {
    if (!data?.assignment) return null;
    
    const { assignment } = data;
    const now = new Date();
    const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
    
    if (!assignment.isPublished) {
      return { text: 'Draft', color: 'text-gray-600 bg-gray-100', icon: ExclamationTriangleIcon };
    }
    
    if (deadline && now > deadline) {
      return { text: 'Expired', color: 'text-red-600 bg-red-100', icon: ExclamationTriangleIcon };
    }
    
    return { text: 'Active', color: 'text-green-600 bg-green-100', icon: CheckCircleIcon };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignment not found</h2>
            <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => router.back()}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const assignmentStatus = getAssignmentStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => router.push('/instructor/dashboard')}
            className="hover:text-primary-600"
          >
            Instructor Dashboard
          </button>
          <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          <button
            onClick={() => router.push(`/instructor/courses/${params?.id}`)}
            className="hover:text-primary-600"
          >
            {data.course.title}
          </button>
          <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          <button
            onClick={() => router.back()}
            className="hover:text-primary-600"
          >
            {data.assignment.title}
          </button>
          <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          <span className="text-gray-900 font-medium">Submissions</span>
        </nav>

        {/* Assignment Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{data.assignment.title}</h1>
                {assignmentStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignmentStatus.color}`}>
                    <assignmentStatus.icon className="h-3 w-3 mr-1" />
                    {assignmentStatus.text}
                  </span>
                )}
              </div>
              {data.assignment.description && (
                <p className="text-gray-600 mb-4">{data.assignment.description}</p>
              )}
            </div>
            
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Assignment
            </button>
          </div>

          {/* Assignment Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="font-semibold text-gray-900">{data.assignment.totalPoints}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Passing Score</p>
                <p className="font-semibold text-gray-900">{data.assignment.passingScore}%</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="font-semibold text-gray-900">
                  {data.assignment.timeLimit ? `${data.assignment.timeLimit} min` : 'No limit'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold text-gray-900">
                  {data.assignment.deadline ? formatDate(data.assignment.deadline) : 'No deadline'}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.statistics.totalSubmissions}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.statistics.averagePercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.statistics.passRate}%</div>
              <div className="text-sm text-gray-600">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.statistics.lateCount}</div>
              <div className="text-sm text-gray-600">Late Submissions</div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <SubmissionsList
          submissions={data.submissions}
          assignment={data.assignment}
          statistics={data.statistics}
          pagination={data.pagination}
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSubmissionClick={handleSubmissionClick}
          onFiltersChange={setFilters}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          onPageChange={setCurrentPage}
        />

        {/* Submission Modal */}
        {showSubmissionModal && selectedSubmission && (
          <SubmissionModal
            submission={selectedSubmission}
            assignment={data.assignment}
            onClose={() => {
              setShowSubmissionModal(false);
              setSelectedSubmission(null);
            }}
            onGradeUpdate={handleGradeUpdate}
          />
        )}
      </div>
    </div>
  );
}
