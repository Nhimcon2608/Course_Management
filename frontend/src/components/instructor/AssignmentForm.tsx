'use client';

import React, { useState, useEffect } from 'react';
import { 
  X,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Clock,
  Award,
  Users,
  Settings,
  FileText,
  Upload,
  Type,
  CheckSquare
} from 'lucide-react';
import { Question, CreateAssignmentData } from '@/services/lessonApi';
import { toast } from 'react-hot-toast';

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssignmentData) => Promise<void>;
  initialData?: Partial<CreateAssignmentData>;
  isLoading?: boolean;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: CheckSquare },
  { value: 'text', label: 'Văn bản', icon: Type },
  { value: 'file_upload', label: 'Tải file', icon: Upload },
  { value: 'essay', label: 'Tự luận', icon: FileText }
] as const;

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    instructions: '',
    questions: [],
    totalPoints: 0,
    passingScore: 70,
    timeLimit: 60,
    attempts: 1,
    deadline: '',
    isPublished: false,
    autoGrade: true,
    showResults: true,
    showCorrectAnswers: true
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'settings'>('basic');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof CreateAssignmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    const newQuestion: Omit<Question, '_id'> = {
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      required: true,
      explanation: ''
    };

    setFormData(prev => {
      const newQuestions = [...prev.questions, newQuestion];
      const totalPoints = newQuestions.reduce((total, q) => total + q.points, 0);
      return {
        ...prev,
        questions: newQuestions,
        totalPoints
      };
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setFormData(prev => {
      const newQuestions = prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      );
      const totalPoints = newQuestions.reduce((total, q) => total + q.points, 0);
      return {
        ...prev,
        questions: newQuestions,
        totalPoints
      };
    });
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => {
      const newQuestions = prev.questions.filter((_, i) => i !== index);
      const totalPoints = newQuestions.reduce((total, q) => total + q.points, 0);
      return {
        ...prev,
        questions: newQuestions,
        totalPoints
      };
    });
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      const [movedQuestion] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, movedQuestion);
      const totalPoints = newQuestions.reduce((total, q) => total + q.points, 0);
      return {
        ...prev,
        questions: newQuestions,
        totalPoints
      };
    });
  };

  const calculateTotalPoints = () => {
    return formData.totalPoints || formData.questions.reduce((total, question) => total + question.points, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question.trim()) {
        toast.error(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
        return;
      }

      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.some(opt => !opt.trim())) {
          toast.error(`Câu hỏi ${i + 1}: Vui lòng nhập đầy đủ các lựa chọn`);
          return;
        }
        if (question.correctAnswer === undefined || question.correctAnswer === null) {
          toast.error(`Câu hỏi ${i + 1}: Vui lòng chọn đáp án đúng`);
          return;
        }
      }

      if (question.points <= 0) {
        toast.error(`Câu hỏi ${i + 1}: Điểm số phải lớn hơn 0`);
        return;
      }
    }

    try {
      // Calculate total points and prepare submission data
      const totalPoints = calculateTotalPoints();
      const submissionData = {
        ...formData,
        totalPoints
      };

      // Debug logging
      console.log('Form submission data:', {
        title: submissionData.title,
        questionsCount: submissionData.questions.length,
        totalPoints: submissionData.totalPoints,
        calculatedPoints: totalPoints
      });

      await onSubmit(submissionData);
      onClose();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {initialData ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4">
                <nav className="flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'basic'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Thông tin cơ bản
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'questions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Câu hỏi ({formData.questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Cài đặt
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-96 overflow-y-auto">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tiêu đề bài tập *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nhập tiêu đề bài tập"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Mô tả ngắn về bài tập"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hướng dẫn làm bài
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      rows={4}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Hướng dẫn chi tiết cho học viên"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hạn nộp bài
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Điểm đạt ({formData.passingScore}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.passingScore}
                        onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value))}
                        className="mt-1 block w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Câu hỏi ({formData.questions.length})
                      </h4>
                      <p className="text-sm text-gray-500">
                        Tổng điểm: {calculateTotalPoints()} điểm
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm câu hỏi
                    </button>
                  </div>

                  {formData.questions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có câu hỏi</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Bắt đầu bằng cách thêm câu hỏi đầu tiên.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.questions.map((question, index) => (
                        <QuestionEditor
                          key={index}
                          question={question}
                          index={index}
                          onUpdate={updateQuestion}
                          onRemove={removeQuestion}
                          onMove={moveQuestion}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Thời gian làm bài (phút)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.timeLimit}
                        onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Số lần làm bài
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.attempts}
                        onChange={(e) => handleInputChange('attempts', parseInt(e.target.value) || 1)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Xuất bản ngay
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.autoGrade}
                        onChange={(e) => handleInputChange('autoGrade', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Tự động chấm điểm
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.showResults}
                        onChange={(e) => handleInputChange('showResults', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Hiển thị kết quả cho học viên
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.showCorrectAnswers}
                        onChange={(e) => handleInputChange('showCorrectAnswers', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Hiển thị đáp án đúng
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {initialData ? 'Cập nhật' : 'Tạo bài tập'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: Omit<Question, '_id'>;
  index: number;
  onUpdate: (index: number, field: keyof Question, value: any) => void;
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onRemove,
  onMove
}) => {
  const questionType = QUESTION_TYPES.find(type => type.value === question.type);
  const Icon = questionType?.icon || FileText;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            Câu {index + 1}: {questionType?.label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate(index, 'type', e.target.value)}
            className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            {QUESTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Câu hỏi *
          </label>
          <textarea
            value={question.question}
            onChange={(e) => onUpdate(index, 'question', e.target.value)}
            rows={2}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Nhập nội dung câu hỏi"
          />
        </div>

        {question.type === 'multiple_choice' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Lựa chọn *
            </label>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question-${index}-correct`}
                    checked={question.correctAnswer === optionIndex}
                    onChange={() => onUpdate(index, 'correctAnswer', optionIndex)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      onUpdate(index, 'options', newOptions);
                    }}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Điểm số
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={question.points}
              onChange={(e) => onUpdate(index, 'points', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate(index, 'required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-xs text-gray-900">
              Bắt buộc
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Giải thích (tùy chọn)
          </label>
          <textarea
            value={question.explanation}
            onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
            rows={2}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Giải thích đáp án hoặc gợi ý"
          />
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;
