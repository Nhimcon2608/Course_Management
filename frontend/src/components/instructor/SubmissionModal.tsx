'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Answer {
  questionId: string;
  answer: string | number | string[];
  isCorrect?: boolean;
  points?: number;
  gradedAt?: string;
  feedback?: string;
}

interface Question {
  _id: string;
  type: 'multiple_choice' | 'text' | 'essay' | 'file_upload';
  question: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
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
  startedAt?: string;
  isLate: boolean;
  answers: Answer[];
  feedback?: string;
}

interface Assignment {
  _id: string;
  title: string;
  totalPoints: number;
  passingScore: number;
  questions: Question[];
}

interface SubmissionModalProps {
  submission: Submission;
  assignment: Assignment;
  onClose: () => void;
  onGradeUpdate: (submissionId: string, gradeData: any) => Promise<void>;
}

export default function SubmissionModal({
  submission,
  assignment,
  onClose,
  onGradeUpdate
}: SubmissionModalProps) {
  const [gradedAnswers, setGradedAnswers] = useState<Answer[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    setGradedAnswers([...submission.answers]);
    setOverallFeedback(submission.feedback || '');
    setTotalScore(submission.score);
  }, [submission]);

  useEffect(() => {
    // Recalculate total score when answers change
    const newTotal = gradedAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    setTotalScore(newTotal);
  }, [gradedAnswers]);

  const handleAnswerGrade = (questionId: string, points: number, feedback: string = '') => {
    setGradedAnswers(prev => prev.map(answer => 
      answer.questionId === questionId 
        ? { ...answer, points, feedback, gradedAt: new Date().toISOString() }
        : answer
    ));
  };

  const handleSaveGrade = async () => {
    try {
      setIsGrading(true);
      
      await onGradeUpdate(submission._id, {
        answers: gradedAnswers,
        feedback: overallFeedback,
        status: 'graded'
      });
      
      toast.success('Grade saved successfully');
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setIsGrading(false);
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

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQuestionByAnswer = (answer: Answer): Question | undefined => {
    return assignment.questions.find(q => q._id === answer.questionId);
  };

  const renderAnswer = (answer: Answer, question: Question) => {
    switch (question.type) {
      case 'multiple_choice':
        const selectedOption = question.options?.[answer.answer as number];
        const correctOption = question.options?.[question.correctAnswer || 0];
        const isCorrect = answer.answer === question.correctAnswer;
        
        return (
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  Student Answer: {selectedOption || 'No answer'}
                </span>
              </div>
              {!isCorrect && (
                <div className="mt-2 text-sm text-gray-600">
                  Correct Answer: {correctOption}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'text':
      case 'essay':
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">
              {answer.answer as string || 'No answer provided'}
            </p>
          </div>
        );
        
      case 'file_upload':
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">
                {answer.answer as string || 'No file uploaded'}
              </span>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown question type</div>;
    }
  };

  const percentage = assignment.totalPoints > 0 ? Math.round((totalScore / assignment.totalPoints) * 100) : 0;
  const isPassing = percentage >= assignment.passingScore;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {submission.student.avatar ? (
                <img
                  className="h-12 w-12 rounded-full"
                  src={submission.student.avatar}
                  alt={submission.student.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {submission.student.name}
              </h2>
              <p className="text-sm text-gray-600">{submission.student.email}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Submission Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="font-medium">{formatDate(submission.submittedAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Time Spent</p>
                <p className="font-medium">{formatTimeSpent(submission.timeSpent)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Attempt</p>
              <p className="font-medium">{submission.attemptNumber}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  submission.status === 'graded' ? 'text-green-700 bg-green-100' :
                  submission.status === 'submitted' ? 'text-blue-700 bg-blue-100' :
                  'text-gray-700 bg-gray-100'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
                {submission.isLate && (
                  <span className="text-xs text-red-600 font-medium">Late</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Score */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Score</h3>
                <p className="text-sm text-gray-600">
                  {totalScore} out of {assignment.totalPoints} points
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-gray-600">
                  {isPassing ? 'Passing' : 'Not Passing'} ({assignment.passingScore}% required)
                </div>
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
            
            {gradedAnswers.map((answer, index) => {
              const question = getQuestionByAnswer(answer);
              if (!question) return null;

              return (
                <div key={answer.questionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <span className="text-sm text-gray-600">
                        {question.points} points
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{question.question}</p>
                  </div>

                  {/* Student Answer */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Student Answer:</h5>
                    {renderAnswer(answer, question)}
                  </div>

                  {/* Grading Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Points Awarded
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={question.points}
                          value={answer.points || 0}
                          onChange={(e) => handleAnswerGrade(
                            answer.questionId,
                            parseInt(e.target.value) || 0,
                            answer.feedback || ''
                          )}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Add feedback for this answer..."
                          value={answer.feedback || ''}
                          onChange={(e) => handleAnswerGrade(
                            answer.questionId,
                            answer.points || 0,
                            e.target.value
                          )}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Feedback */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Feedback
            </label>
            <textarea
              rows={4}
              placeholder="Provide overall feedback for this submission..."
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Total Score: <span className="font-semibold">{totalScore}/{assignment.totalPoints}</span> ({percentage}%)
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrade}
              disabled={isGrading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGrading ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
