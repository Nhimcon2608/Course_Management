'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Question {
  _id: string;
  type: 'multiple_choice' | 'text' | 'essay' | 'file_upload';
  question: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
  required?: boolean;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: Question[];
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

interface Answer {
  questionId: string;
  answer: string | number | string[];
}

interface AssignmentTakingProps {
  assignment: Assignment;
  submissionData: any;
  onBack: () => void;
  onSubmit: (answers: Answer[], timeSpent: number) => Promise<void>;
  onSaveDraft: (answers: Answer[], timeSpent: number) => Promise<void>;
}

export default function AssignmentTaking({
  assignment,
  submissionData,
  onBack,
  onSubmit,
  onSaveDraft
}: AssignmentTakingProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Initialize timer if assignment has time limit
  useEffect(() => {
    if (assignment.timeLimit) {
      setTimeLeft(assignment.timeLimit * 60); // Convert minutes to seconds
    }
  }, [assignment.timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Load existing draft if available
  useEffect(() => {
    if (submissionData?.submissions) {
      const draft = submissionData.submissions.find((sub: any) => sub.status === 'draft');
      if (draft && draft.answers) {
        setAnswers(draft.answers);
      }
    }
  }, [submissionData]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeSpent = (): number => {
    return Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60); // in minutes
  };

  const handleAnswerChange = (questionId: string, answer: string | number | string[]) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      }
      return [...prev, { questionId, answer }];
    });
  };

  const getAnswer = (questionId: string): string | number | string[] => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.answer || '';
  };

  const isAnswered = (questionId: string): boolean => {
    const answer = getAnswer(questionId);
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== '' && answer !== null && answer !== undefined;
  };

  const getAnsweredCount = (): number => {
    return assignment.questions.filter(q => isAnswered(q._id)).length;
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    
    toast.error('Time is up! Submitting assignment automatically...');
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      setIsSubmitting(true);
      
      if (!isAutoSubmit) {
        // Check if all required questions are answered
        const unansweredRequired = assignment.questions.filter(q => 
          q.required !== false && !isAnswered(q._id)
        );
        
        if (unansweredRequired.length > 0) {
          toast.error(`Please answer all required questions (${unansweredRequired.length} remaining)`);
          return;
        }
      }

      await onSubmit(answers, getTimeSpent());
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      await onSaveDraft(answers, getTimeSpent());
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const answer = getAnswer(question._id);
    const isRequired = question.required !== false;

    return (
      <div key={question._id} className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-400">
                Question {index + 1}
              </span>
              {isRequired && (
                <span className="text-red-400 text-sm">*</span>
              )}
              <span className="text-sm text-gray-400">
                ({question.points} {question.points === 1 ? 'point' : 'points'})
              </span>
            </div>
            <h3 className="text-lg font-medium text-white mb-4">
              {question.question}
            </h3>
          </div>
          {isAnswered(question._id) && (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
          )}
        </div>

        {question.type === 'multiple_choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={optionIndex}
                  checked={answer === optionIndex}
                  onChange={(e) => handleAnswerChange(question._id, parseInt(e.target.value))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <input
            type="text"
            value={answer as string}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {question.type === 'essay' && (
          <textarea
            value={answer as string}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Write your essay here..."
            rows={6}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
        )}

        {question.type === 'file_upload' && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">File upload functionality will be implemented in the next phase</p>
            <input
              type="text"
              value={answer as string}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="For now, enter file description or URL..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Assignment
          </button>
          
          {timeLeft !== null && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
            }`}>
              <ClockIcon className="h-5 w-5" />
              <span className="font-mono text-lg">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Assignment Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
          <p className="text-gray-400 mb-4">Lesson: {assignment.lesson.title}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{getAnsweredCount()}</div>
              <div className="text-gray-400">of {assignment.questions.length} answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{assignment.totalPoints}</div>
              <div className="text-gray-400">total points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{assignment.passingScore}%</div>
              <div className="text-gray-400">to pass</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {submissionData?.attemptCount + 1 || 1}
              </div>
              <div className="text-gray-400">of {assignment.attempts} attempts</div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {assignment.questions.map((question, index) => renderQuestion(question, index))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-gray-800 rounded-lg p-6">
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting || getAnsweredCount() === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Confirm Submission</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to submit this assignment? You have answered{' '}
                <span className="font-semibold">{getAnsweredCount()}</span> out of{' '}
                <span className="font-semibold">{assignment.questions.length}</span> questions.
                {submissionData?.attemptCount + 1 === assignment.attempts && (
                  <span className="block mt-2 text-yellow-400 font-medium">
                    This is your final attempt!
                  </span>
                )}
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
