import mongoose, { Schema } from 'mongoose';
import { IProgress } from '@/types';

const lessonProgressSchema = new Schema({
  lesson: {
    type: Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  watchTime: {
    type: Number,
    default: 0,
    min: [0, 'Watch time cannot be negative']
  },
  totalTime: {
    type: Number,
    default: 0,
    min: [0, 'Total time cannot be negative']
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const progressSchema = new Schema<IProgress>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Progress percentage cannot be negative'],
    max: [100, 'Progress percentage cannot exceed 100']
  },
  completedLessons: [{
    type: Schema.Types.ObjectId
  }],
  lessonsProgress: [lessonProgressSchema],
  currentLesson: {
    type: Schema.Types.ObjectId
  },
  totalWatchTime: {
    type: Number,
    default: 0,
    min: [0, 'Total watch time cannot be negative']
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  certificateId: {
    type: String,
    trim: true
  },
  notes: [{
    lesson: {
      type: Schema.Types.ObjectId,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note content cannot exceed 1000 characters']
    },
    timestamp: {
      type: Number,
      min: [0, 'Timestamp cannot be negative']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lesson: {
      type: Schema.Types.ObjectId,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Bookmark title cannot exceed 200 characters']
    },
    timestamp: {
      type: Number,
      required: true,
      min: [0, 'Timestamp cannot be negative']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1 });
progressSchema.index({ course: 1 });
progressSchema.index({ status: 1 });
progressSchema.index({ completedAt: -1 });
progressSchema.index({ lastAccessedAt: -1 });
progressSchema.index({ progressPercentage: -1 });

// Virtual for completion status
progressSchema.virtual('isCompleted').get(function() {
  return this.progressPercentage === 100 && this.status === 'completed';
});

// Virtual for time spent learning
progressSchema.virtual('timeSpent').get(function() {
  if (this.startedAt && this.lastAccessedAt) {
    return Math.floor((this.lastAccessedAt.getTime() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24)); // days
  }
  return 0;
});

// Pre-save middleware to update progress percentage
progressSchema.pre('save', async function(next) {
  if (this.isModified('completedLessons') || this.isModified('lessonsProgress')) {
    try {
      const Lesson = mongoose.model('Lesson');
      // Get total published lessons count from separate lessons collection
      const totalLessons = await Lesson.countDocuments({
        course: this.course,
        isPublished: true
      });

      if (totalLessons > 0) {
        const completedCount = this.completedLessons.length;
        this.progressPercentage = Math.round((completedCount / totalLessons) * 100);

        // Update status based on progress
        if (this.progressPercentage === 0) {
          this.status = 'not_started';
        } else if (this.progressPercentage === 100) {
          this.status = 'completed';
          if (!this.completedAt) {
            this.completedAt = new Date();
          }
        } else {
          this.status = 'in_progress';
          if (!this.startedAt) {
            this.startedAt = new Date();
          }
        }
      }
    } catch (error) {
      console.error('Error in Progress pre-save middleware:', error);
      // Continue without updating progress percentage if there's an error
    }
  }

  // Update last accessed time
  this.lastAccessedAt = new Date();

  next();
});

// Instance method to mark lesson as completed
progressSchema.methods.completeLesson = async function(lessonId: string, watchTime?: number) {
  // Add to completed lessons if not already there
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
  }
  
  // Update lesson progress
  const lessonProgressIndex = this.lessonsProgress.findIndex(
    (lp: any) => lp.lesson.toString() === lessonId
  );
  
  if (lessonProgressIndex > -1) {
    this.lessonsProgress[lessonProgressIndex].completed = true;
    this.lessonsProgress[lessonProgressIndex].completedAt = new Date();
    if (watchTime) {
      this.lessonsProgress[lessonProgressIndex].watchTime = watchTime;
      this.totalWatchTime += watchTime;
    }
  } else {
    this.lessonsProgress.push({
      lesson: lessonId,
      completed: true,
      completedAt: new Date(),
      watchTime: watchTime || 0,
      totalTime: watchTime || 0,
      lastWatchedAt: new Date()
    });
    if (watchTime) {
      this.totalWatchTime += watchTime;
    }
  }
  
  await this.save();
  return this;
};

// Instance method to update lesson watch time
progressSchema.methods.updateWatchTime = async function(lessonId: string, watchTime: number, totalTime: number) {
  const lessonProgressIndex = this.lessonsProgress.findIndex(
    (lp: any) => lp.lesson.toString() === lessonId
  );
  
  if (lessonProgressIndex > -1) {
    const oldWatchTime = this.lessonsProgress[lessonProgressIndex].watchTime || 0;
    this.lessonsProgress[lessonProgressIndex].watchTime = watchTime;
    this.lessonsProgress[lessonProgressIndex].totalTime = totalTime;
    this.lessonsProgress[lessonProgressIndex].lastWatchedAt = new Date();
    
    // Update total watch time
    this.totalWatchTime = this.totalWatchTime - oldWatchTime + watchTime;
  } else {
    this.lessonsProgress.push({
      lesson: lessonId,
      completed: false,
      watchTime,
      totalTime,
      lastWatchedAt: new Date()
    });
    this.totalWatchTime += watchTime;
  }
  
  // Set current lesson
  this.currentLesson = lessonId;
  
  await this.save();
  return this;
};

// Instance method to add note
progressSchema.methods.addNote = async function(lessonId: string, content: string, timestamp?: number) {
  this.notes.push({
    lesson: lessonId,
    content,
    timestamp: timestamp || 0,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

// Instance method to add bookmark
progressSchema.methods.addBookmark = async function(lessonId: string, title: string, timestamp: number) {
  this.bookmarks.push({
    lesson: lessonId,
    title,
    timestamp,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

// Instance method to issue certificate
progressSchema.methods.issueCertificate = async function() {
  if (this.progressPercentage === 100 && !this.certificateIssued) {
    this.certificateIssued = true;
    this.certificateIssuedAt = new Date();
    this.certificateId = `CERT-${this.user}-${this.course}-${Date.now()}`;
    await this.save();
  }
  return this;
};

// Static method to get user learning statistics
progressSchema.statics.getUserStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        completedCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        totalWatchTime: { $sum: '$totalWatchTime' },
        averageProgress: { $avg: '$progressPercentage' },
        certificatesEarned: {
          $sum: { $cond: ['$certificateIssued', 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalWatchTime: 0,
    averageProgress: 0,
    certificatesEarned: 0
  };
};

// Static method to get course completion statistics
progressSchema.statics.getCourseStats = async function(courseId: string) {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progressPercentage' },
        averageWatchTime: { $avg: '$totalWatchTime' }
      }
    }
  ]);

  const result = stats[0] || {
    totalEnrollments: 0,
    completedCount: 0,
    averageProgress: 0,
    averageWatchTime: 0
  };

  result.completionRate = result.totalEnrollments > 0 
    ? (result.completedCount / result.totalEnrollments) * 100 
    : 0;

  return result;
};

// Add static methods to interface
interface ProgressModel extends mongoose.Model<IProgress> {
  getUserStats(userId: string): Promise<any>;
  getCourseStats(courseId: string): Promise<any>;
  getRecentActivity(userId: string, limit?: number): Promise<any>;
}

const Progress = mongoose.model<IProgress, ProgressModel>('Progress', progressSchema);

export default Progress;
