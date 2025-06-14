import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  _id?: string;
  type: 'multiple_choice' | 'text' | 'file_upload' | 'essay';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer?: string | number; // for multiple choice (index) or text
  points: number;
  required: boolean;
  explanation?: string;
}

export interface ISubmission {
  student: mongoose.Types.ObjectId;
  answers: Array<{
    questionId: string;
    answer: string | number | string[]; // string for text/essay, number for MC index, string[] for file URLs
    isCorrect?: boolean;
    points?: number;
  }>;
  totalPoints: number;
  maxPoints: number;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

export interface IAssignment extends Document {
  _id: string;
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  questions: IQuestion[];
  totalPoints: number;
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  attempts: number; // max attempts allowed
  deadline?: Date;
  isPublished: boolean;
  autoGrade: boolean; // auto-grade multiple choice questions
  showResults: boolean; // show results immediately after submission
  showCorrectAnswers: boolean;
  submissions: ISubmission[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['multiple_choice', 'text', 'file_upload', 'essay'],
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  options: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  correctAnswer: {
    type: Schema.Types.Mixed // string for text, number for MC index
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  required: {
    type: Boolean,
    default: true
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: 500
  }
});

const submissionSchema = new Schema<ISubmission>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true
    },
    isCorrect: {
      type: Boolean
    },
    points: {
      type: Number,
      min: 0
    }
  }],
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  maxPoints: {
    type: Number,
    required: true,
    min: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  }
});

const assignmentSchema = new Schema<IAssignment>({
  lesson: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  questions: [questionSchema],
  totalPoints: {
    type: Number,
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 70
  },
  timeLimit: {
    type: Number,
    min: 5,
    max: 300 // max 5 hours
  },
  attempts: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 3
  },
  deadline: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  autoGrade: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  submissions: [submissionSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assignmentSchema.index({ lesson: 1 });
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ course: 1, isPublished: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

// Virtuals
assignmentSchema.virtual('submissionCount').get(function() {
  return this.submissions?.length || 0;
});

assignmentSchema.virtual('averageScore').get(function() {
  if (!this.submissions || this.submissions.length === 0) return 0;
  
  const gradedSubmissions = this.submissions.filter(s => s.status === 'graded');
  if (gradedSubmissions.length === 0) return 0;
  
  const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.totalPoints / s.maxPoints * 100), 0);
  return Math.round(totalScore / gradedSubmissions.length);
});

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
  // Calculate total points from questions
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  next();
});

// Instance methods
assignmentSchema.methods.getStudentSubmission = function(studentId: string) {
  return this.submissions.find((s: any) => s.student.toString() === studentId);
};

assignmentSchema.methods.getStudentAttempts = function(studentId: string) {
  return this.submissions.filter((s: any) => s.student.toString() === studentId).length;
};

assignmentSchema.methods.canStudentSubmit = function(studentId: string) {
  const attempts = this.getStudentAttempts(studentId);
  const hasDeadlinePassed = this.deadline && new Date() > this.deadline;
  
  return attempts < this.attempts && !hasDeadlinePassed && this.isPublished;
};

// Static methods
assignmentSchema.statics.getByLesson = function(lessonId: string, includeUnpublished = false) {
  const query: any = { lesson: lessonId };
  if (!includeUnpublished) {
    query.isPublished = true;
  }
  
  return this.find(query).populate('lesson', 'title order');
};

assignmentSchema.statics.getByCourse = function(courseId: string, includeUnpublished = false) {
  const query: any = { course: courseId };
  if (!includeUnpublished) {
    query.isPublished = true;
  }
  
  return this.find(query)
    .populate('lesson', 'title order')
    .sort({ 'lesson.order': 1 });
};

const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);

export default Assignment;
