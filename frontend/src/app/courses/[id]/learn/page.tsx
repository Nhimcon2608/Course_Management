'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  Bars3Icon,
  DocumentTextIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import VideoPlayer from '@/components/VideoPlayer';
import AssignmentTaking from '@/components/AssignmentTaking';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  videoSize?: number;
  videoFormat?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'link' | 'image' | 'other';
    size?: number;
  }>;
  completed?: boolean;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: any[];
  totalPoints: number;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  deadline?: string;
  lesson: {
    _id: string;
    title: string;
    order: number;
  };
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  instructor: {
    name: string;
    avatar: string;
  };
  duration: number;
  level: string;
}

interface Progress {
  _id: string;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedLessons: string[];
  currentLesson?: string;
  totalWatchTime: number;
  lastAccessedAt: string;
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentView, setCurrentView] = useState<'lesson' | 'assignment' | 'taking-assignment'>('lesson');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    fetchCourseData();
  }, [isAuthenticated, router, params?.id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      if (!params?.id) {
        throw new Error('Course ID is required');
      }

      // Fetch course data
      const courseRes = await fetch(`/api/courses/${params.id}`, {
        credentials: 'include'
      });

      if (!courseRes.ok) {
        throw new Error('Course not found');
      }

      const courseData = await courseRes.json();

      if (!courseData.success) {
        throw new Error(courseData.message || 'Failed to load course');
      }

      setCourse(courseData.data.course);
      setIsEnrolled(courseData.data.isEnrolled);

      // Check if user is enrolled
      if (!courseData.data.isEnrolled) {
        toast.error('You need to enroll in this course first');
        router.push(`/courses/${params.id}`);
        return;
      }

      // Fetch lessons and assignments separately
      const [lessonsRes, assignmentsRes, progressRes] = await Promise.allSettled([
        fetch(`/api/learning/courses/${params.id}/lessons`, { credentials: 'include' }),
        fetch(`/api/learning/courses/${params.id}/assignments`, { credentials: 'include' }),
        fetch(`/api/learning/progress?courseId=${params.id}`, { credentials: 'include' })
      ]);

      // Handle lessons data
      let fetchedLessons: Lesson[] = [];
      if (lessonsRes.status === 'fulfilled' && lessonsRes.value.ok) {
        const lessonsData = await lessonsRes.value.json();
        if (lessonsData.success && lessonsData.data.lessons) {
          fetchedLessons = lessonsData.data.lessons;
          setLessons(fetchedLessons);
        }
      }

      // Handle assignments data
      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.ok) {
        const assignmentsData = await assignmentsRes.value.json();
        if (assignmentsData.success && assignmentsData.data.assignments) {
          setAssignments(assignmentsData.data.assignments);
        }
      }

      // Handle progress data
      let progressData = null;
      if (progressRes.status === 'fulfilled' && progressRes.value.ok) {
        progressData = await progressRes.value.json();
        if (progressData.success && progressData.data) {
          setProgress(progressData.data);
        }
      }

      // Set current lesson from fetched lessons array
      if (fetchedLessons.length > 0) {
        // Find the last accessed lesson or start from the first
        let lessonIndex = 0;
        if (progressData?.data?.currentLesson) {
          const foundIndex = fetchedLessons.findIndex(
            (lesson: Lesson) => lesson._id === progressData.data.currentLesson
          );
          if (foundIndex !== -1) {
            lessonIndex = foundIndex;
          }
        }

        setCurrentLessonIndex(lessonIndex);
        setCurrentLesson(fetchedLessons[lessonIndex]);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
      router.push('/learning');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (lessonId: string, completed: boolean, watchTime: number) => {
    try {
      if (!params?.id) return;

      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: params.id,
          lessonId,
          completed,
          watchTime,
          totalTime: currentLesson?.duration || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProgress(data.data);

          // Update lesson completion status in lessons array
          if (completed) {
            setLessons(prevLessons =>
              prevLessons.map(lesson =>
                lesson._id === lessonId
                  ? { ...lesson, completed: true }
                  : lesson
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleLessonSelect = (lesson: Lesson, index: number) => {
    setCurrentLesson(lesson);
    setCurrentLessonIndex(index);
    setWatchTime(0);
    setIsPlaying(false);

    // Reset assignment view when selecting a new lesson
    setCurrentView('lesson');
    setSelectedAssignment(null);

    // Update progress for lesson start
    updateProgress(lesson._id, false, 0);
  };

  const handleLessonComplete = () => {
    if (currentLesson) {
      updateProgress(currentLesson._id, true, currentLesson.duration * 60);
      toast.success('Lesson completed!');

      // Auto-advance to next lesson
      if (currentLessonIndex < lessons.length - 1) {
        setTimeout(() => {
          const nextIndex = currentLessonIndex + 1;
          const nextLesson = lessons[nextIndex];
          if (nextLesson) {
            handleLessonSelect(nextLesson, nextIndex);
          }
        }, 2000);
      } else {
        toast.success('Congratulations! You have completed the course!');
      }
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevIndex = currentLessonIndex - 1;
      const prevLesson = lessons[prevIndex];
      handleLessonSelect(prevLesson, prevIndex);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextIndex = currentLessonIndex + 1;
      const nextLesson = lessons[nextIndex];
      handleLessonSelect(nextLesson, nextIndex);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateProgress = () => {
    if (!lessons || lessons.length === 0 || !progress) return 0;
    if (!progress.completedLessons || !Array.isArray(progress.completedLessons)) return 0;
    return Math.round((progress.completedLessons.length / lessons.length) * 100);
  };

  // Helper function to get assignments for a specific lesson
  const getAssignmentsForLesson = (lessonId: string): Assignment[] => {
    return assignments.filter(assignment => assignment.lesson._id === lessonId);
  };



  // Helper function to format deadline
  const formatDeadline = (deadline?: string): string => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  // Handle assignment selection
  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('assignment');
  };

  // Handle back to lesson view
  const handleBackToLesson = () => {
    setCurrentView('lesson');
    setSelectedAssignment(null);
    setSubmissionData(null);
  };

  // Handle starting assignment
  const handleStartAssignment = async (assignment: Assignment) => {
    try {
      setIsLoadingSubmission(true);

      // Fetch submission data to check attempts and existing submissions
      const response = await fetch(`/api/learning/assignments/${assignment._id}/submission`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submission data');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch submission data');
      }

      // Check if user can submit
      if (!data.data.canSubmit) {
        if (data.data.attemptCount >= assignment.attempts) {
          toast.error(`Maximum number of attempts (${assignment.attempts}) reached`);
        } else if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
          toast.error('Assignment deadline has passed');
        }
        return;
      }

      setSubmissionData(data.data);
      setSelectedAssignment(assignment);
      setCurrentView('taking-assignment');
    } catch (error) {
      console.error('Error starting assignment:', error);
      toast.error('Failed to start assignment');
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  // Handle assignment submission
  const handleAssignmentSubmit = async (answers: any[], timeSpent: number) => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(`/api/learning/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answers,
          timeSpent,
          startedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit assignment');
      }

      toast.success('Assignment submitted successfully!');

      // Show results
      const submission = data.data.submission;
      toast.success(`Score: ${submission.score}/${submission.maxScore} (${submission.percentage}%)`);

      // Go back to assignment view
      setCurrentView('assignment');

      // Refresh submission data
      await handleStartAssignment(selectedAssignment);

    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
      throw error;
    }
  };

  // Handle assignment draft saving
  const handleAssignmentSaveDraft = async (answers: any[], timeSpent: number) => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(`/api/learning/assignments/${selectedAssignment._id}/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answers,
          timeSpent,
          startedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save draft');
      }

    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course || !isEnrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You need to enroll in this course to access the content.</p>
          <Link
            href={`/courses/${params?.id || ''}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            View Course Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-800 border-r border-gray-700`}>
        <div className="p-4">
          {/* Course Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/learning"
                className="text-gray-400 hover:text-white flex items-center"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Learning
              </Link>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white lg:hidden"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <h1 className="text-lg font-semibold text-white mb-2 line-clamp-2">
              {course.title}
            </h1>
            
            <div className="text-sm text-gray-400 mb-4">
              by {course.instructor.name}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Course Content ({lessons.length} lessons)
            </h3>

            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const isCompleted = progress?.completedLessons?.includes(lesson._id) || false;
                const isCurrent = currentLesson?._id === lesson._id;
                const lessonAssignments = getAssignmentsForLesson(lesson._id);
                const hasLessonAssignments = lessonAssignments.length > 0;

                return (
                <div key={lesson._id} className="space-y-2">
                  <button
                    onClick={() => handleLessonSelect(lesson, index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <PlayIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {index + 1}.
                          </span>
                          <div className="flex items-center space-x-2">
                            {hasLessonAssignments && (
                              <div className="flex items-center space-x-1">
                                <DocumentTextIcon className="h-3 w-3 text-orange-400" />
                                <span className="text-xs text-orange-400">
                                  {lessonAssignments.length}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDuration(lesson.duration)}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-medium line-clamp-2 mt-1">
                          {lesson.title}
                        </h4>

                        {lesson.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Assignment List for Current Lesson */}
                  {isCurrent && hasLessonAssignments && (
                    <div className="ml-8 space-y-1">
                      {lessonAssignments.map((assignment) => (
                        <button
                          key={assignment._id}
                          onClick={() => handleAssignmentSelect(assignment)}
                          className={`w-full text-left p-2 rounded-md transition-colors ${
                            selectedAssignment?._id === assignment._id
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-4 w-4 text-orange-400" />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-medium line-clamp-1">
                                {assignment.title}
                              </h5>
                              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                                <span>{assignment.totalPoints} pts</span>
                                <span>{formatDeadline(assignment.deadline)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BookOpenIcon className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">No lessons available for this course.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              )}
              
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {currentLesson?.title || 'Select a lesson'}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Lesson {currentLessonIndex + 1} of {lessons.length}</span>
                  {currentLesson && getAssignmentsForLesson(currentLesson._id).length > 0 && (
                    <div className="flex items-center space-x-1 text-orange-400">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>{getAssignmentsForLesson(currentLesson._id).length} assignment{getAssignmentsForLesson(currentLesson._id).length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousLesson}
                disabled={currentLessonIndex === 0}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex === lessons.length - 1}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {currentView === 'taking-assignment' && selectedAssignment && submissionData ? (
            /* Assignment Taking View */
            <AssignmentTaking
              assignment={selectedAssignment}
              submissionData={submissionData}
              onBack={handleBackToLesson}
              onSubmit={handleAssignmentSubmit}
              onSaveDraft={handleAssignmentSaveDraft}
            />
          ) : currentView === 'assignment' && selectedAssignment ? (
            /* Assignment View */
            <div className="w-full h-full bg-gray-900 text-white overflow-auto">
              <div className="max-w-4xl mx-auto p-6">
                {/* Assignment Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToLesson}
                    className="flex items-center text-gray-400 hover:text-white mb-4"
                  >
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    Back to Lesson
                  </button>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                          {selectedAssignment.title}
                        </h1>
                        <p className="text-gray-400">
                          Lesson: {selectedAssignment.lesson.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-400">
                          {selectedAssignment.totalPoints} Points
                        </div>
                        <div className="text-sm text-gray-400">
                          Passing: {selectedAssignment.passingScore}%
                        </div>
                      </div>
                    </div>

                    {selectedAssignment.description && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
                        <p className="text-gray-400">{selectedAssignment.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">Time Limit</span>
                        </div>
                        <div className="text-white font-medium mt-1">
                          {selectedAssignment.timeLimit ? `${selectedAssignment.timeLimit} minutes` : 'No limit'}
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <ArrowPathIcon className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300">Attempts</span>
                        </div>
                        <div className="text-white font-medium mt-1">
                          {selectedAssignment.attempts} allowed
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-orange-400" />
                          <span className="text-gray-300">Deadline</span>
                        </div>
                        <div className="text-white font-medium mt-1">
                          {formatDeadline(selectedAssignment.deadline)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Instructions */}
                {selectedAssignment.instructions && (
                  <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {selectedAssignment.instructions}
                    </div>
                  </div>
                )}

                {/* Questions Preview */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Questions ({selectedAssignment.questions.length})
                  </h3>

                  <div className="space-y-4">
                    {selectedAssignment.questions.slice(0, 3).map((question, index) => (
                      <div key={question._id || index} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-400">
                            Question {index + 1}
                          </span>
                          <span className="text-sm text-gray-400">
                            {question.points} {question.points === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                        <p className="text-gray-300">{question.question}</p>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          Type: {question.type.replace('_', ' ')}
                        </div>
                      </div>
                    ))}

                    {selectedAssignment.questions.length > 3 && (
                      <div className="text-center text-gray-400 text-sm">
                        ... and {selectedAssignment.questions.length - 3} more questions
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleBackToLesson}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Back to Lesson
                  </button>
                  <button
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleStartAssignment(selectedAssignment!)}
                    disabled={isLoadingSubmission}
                  >
                    {isLoadingSubmission ? 'Loading...' : 'Start Assignment'}
                  </button>
                </div>
              </div>
            </div>
          ) : currentLesson ? (
            /* Lesson View */
            currentLesson.videoUrl ? (
              <VideoPlayer
                key={currentLesson._id}
                videoUrl={currentLesson.videoUrl}
                title={currentLesson.title}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleLessonComplete}
                className="w-full h-full"
              />
            ) : (
              <div className="text-center text-gray-400">
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No video available</h3>
                <p className="text-sm">This lesson content is not available yet.</p>
                <button
                  onClick={handleLessonComplete}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Mark as Complete
                </button>
              </div>
            )
          ) : (
            <div className="text-center text-gray-400">
              <BookOpenIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a lesson to start learning</h3>
              <p className="text-sm">Choose a lesson from the sidebar to begin.</p>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        {currentLesson && (
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentLesson.title}
              </h3>
              
              {currentLesson.description && (
                <p className="text-gray-300 mb-4">
                  {currentLesson.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDuration(currentLesson.duration)}
                  </span>
                  
                  <span>
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </span>
                </div>
                
                <button
                  onClick={handleLessonComplete}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
