import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnswer {
  questionId: string;
  answer: string | number | string[]; // string for text/essay, number for MC index, string[] for file URLs
  isCorrect?: boolean;
  points?: number;
  gradedAt?: Date;
  feedback?: string;
}

// Interface for static methods
interface IAssignmentSubmissionModel extends Model<IAssignmentSubmission> {
  getSubmissionStats(assignmentId: string): Promise<any>;
  getStudentSubmission(studentId: string, assignmentId: string): Promise<IAssignmentSubmission | null>;
  getAttemptCount(studentId: string, assignmentId: string): Promise<number>;
}

export interface IAssignmentSubmission extends Document {
  _id: string;
  student: mongoose.Types.ObjectId;
  assignment: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  answers: IAnswer[];
  submittedAt: Date;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'submitted' | 'graded' | 'returned' | 'draft';
  attemptNumber: number;
  timeSpent: number; // in minutes
  startedAt: Date;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  feedback?: string;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>({
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
  },
  gradedAt: {
    type: Date
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 500
  }
});

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  lesson: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  answers: [answerSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned', 'draft'],
    default: 'submitted'
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  startedAt: {
    type: Date,
    required: true,
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
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
assignmentSubmissionSchema.index({ student: 1, assignment: 1 });
assignmentSubmissionSchema.index({ assignment: 1, submittedAt: -1 });
assignmentSubmissionSchema.index({ course: 1, submittedAt: -1 });
assignmentSubmissionSchema.index({ lesson: 1, submittedAt: -1 });
assignmentSubmissionSchema.index({ status: 1 });
assignmentSubmissionSchema.index({ student: 1, course: 1 });

// Compound index for finding user's attempts for an assignment
assignmentSubmissionSchema.index({ student: 1, assignment: 1, attemptNumber: 1 }, { unique: true });

// Virtual for pass/fail status
assignmentSubmissionSchema.virtual('isPassed').get(function() {
  return this.percentage >= 70; // Default passing score, can be overridden by assignment
});

// Virtual for grade letter
assignmentSubmissionSchema.virtual('gradeLetter').get(function() {
  if (this.percentage >= 90) return 'A';
  if (this.percentage >= 80) return 'B';
  if (this.percentage >= 70) return 'C';
  if (this.percentage >= 60) return 'D';
  return 'F';
});

// Pre-save middleware to calculate percentage
assignmentSubmissionSchema.pre('save', function(next) {
  if (this.maxScore > 0) {
    this.percentage = Math.round((this.score / this.maxScore) * 100);
  }
  next();
});

// Static method to get submission statistics
assignmentSubmissionSchema.statics.getSubmissionStats = async function(assignmentId: string) {
  const stats = await this.aggregate([
    { $match: { assignment: new mongoose.Types.ObjectId(assignmentId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' },
        passCount: {
          $sum: {
            $cond: [{ $gte: ['$percentage', 70] }, 1, 0]
          }
        },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' }
      }
    }
  ]);

  return stats[0] || {
    totalSubmissions: 0,
    averageScore: 0,
    averagePercentage: 0,
    passCount: 0,
    maxScore: 0,
    minScore: 0
  };
};

// Static method to get student's submission for assignment
assignmentSubmissionSchema.statics.getStudentSubmission = function(studentId: string, assignmentId: string) {
  return this.findOne({
    student: studentId,
    assignment: assignmentId
  }).populate('assignment', 'title totalPoints passingScore')
    .populate('student', 'name email')
    .sort({ attemptNumber: -1 });
};

// Static method to get student's attempt count
assignmentSubmissionSchema.statics.getAttemptCount = async function(studentId: string, assignmentId: string) {
  return await this.countDocuments({
    student: studentId,
    assignment: assignmentId
  });
};

const AssignmentSubmission = mongoose.model<IAssignmentSubmission, IAssignmentSubmissionModel>('AssignmentSubmission', assignmentSubmissionSchema);

export default AssignmentSubmission;
