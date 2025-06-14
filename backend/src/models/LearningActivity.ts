import mongoose, { Schema } from 'mongoose';
import { ILearningActivity } from '@/types';

const learningActivitySchema = new Schema<ILearningActivity>({
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
  lesson: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['lesson_start', 'lesson_complete', 'course_enroll', 'course_complete', 'quiz_attempt', 'note_added'],
    required: [true, 'Activity type is required']
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    watchTime: {
      type: Number,
      min: [0, 'Watch time cannot be negative']
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    },
    noteContent: {
      type: String,
      maxlength: [1000, 'Note content cannot exceed 1000 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
learningActivitySchema.index({ user: 1, createdAt: -1 });
learningActivitySchema.index({ course: 1, createdAt: -1 });
learningActivitySchema.index({ user: 1, course: 1, createdAt: -1 });
learningActivitySchema.index({ type: 1, createdAt: -1 });

// Static method to log course enrollment
learningActivitySchema.statics.logCourseEnrollment = async function(userId: string, courseId: string, courseName: string) {
  const activity = new this({
    user: userId,
    course: courseId,
    type: 'course_enroll',
    description: `Enrolled in course: ${courseName}`
  });
  
  return await activity.save();
};

// Static method to log lesson start
learningActivitySchema.statics.logLessonStart = async function(userId: string, courseId: string, lessonId: string, lessonTitle: string) {
  const activity = new this({
    user: userId,
    course: courseId,
    lesson: lessonId,
    type: 'lesson_start',
    description: `Started lesson: ${lessonTitle}`
  });
  
  return await activity.save();
};

// Static method to log lesson completion
learningActivitySchema.statics.logLessonComplete = async function(userId: string, courseId: string, lessonId: string, lessonTitle: string, watchTime?: number) {
  const activity = new this({
    user: userId,
    course: courseId,
    lesson: lessonId,
    type: 'lesson_complete',
    description: `Completed lesson: ${lessonTitle}`,
    metadata: { watchTime }
  });
  
  return await activity.save();
};

// Static method to log course completion
learningActivitySchema.statics.logCourseComplete = async function(userId: string, courseId: string, courseName: string) {
  const activity = new this({
    user: userId,
    course: courseId,
    type: 'course_complete',
    description: `Completed course: ${courseName}`
  });
  
  return await activity.save();
};

// Static method to log quiz attempt
learningActivitySchema.statics.logQuizAttempt = async function(userId: string, courseId: string, lessonId: string, quizTitle: string, score: number) {
  const activity = new this({
    user: userId,
    course: courseId,
    lesson: lessonId,
    type: 'quiz_attempt',
    description: `Attempted quiz: ${quizTitle} (Score: ${score}%)`,
    metadata: { score }
  });
  
  return await activity.save();
};

// Static method to log note addition
learningActivitySchema.statics.logNoteAdded = async function(userId: string, courseId: string, lessonId: string, lessonTitle: string, noteContent: string) {
  const activity = new this({
    user: userId,
    course: courseId,
    lesson: lessonId,
    type: 'note_added',
    description: `Added note to lesson: ${lessonTitle}`,
    metadata: { noteContent: noteContent.substring(0, 100) + (noteContent.length > 100 ? '...' : '') }
  });
  
  return await activity.save();
};

// Static method to get user activities
learningActivitySchema.statics.getUserActivities = async function(userId: string, limit: number = 20, offset: number = 0) {
  const activities = await this.find({ user: userId })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments({ user: userId });
  
  return {
    activities,
    total,
    hasMore: offset + limit < total
  };
};

// Static method to get course activities
learningActivitySchema.statics.getCourseActivities = async function(courseId: string, limit: number = 20, offset: number = 0) {
  const activities = await this.find({ course: courseId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments({ course: courseId });
  
  return {
    activities,
    total,
    hasMore: offset + limit < total
  };
};

// Static method to get recent activities
learningActivitySchema.statics.getRecentActivities = async function(userId: string, days: number = 7, limit: number = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const activities = await this.find({
    user: userId,
    createdAt: { $gte: startDate }
  })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
    
  return activities;
};

// Static method to get activity statistics
learningActivitySchema.statics.getActivityStats = async function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalWatchTime: { $sum: '$metadata.watchTime' }
      }
    }
  ]);
  
  const dailyStats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        watchTime: { $sum: '$metadata.watchTime' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return {
    typeBreakdown: stats,
    dailyActivity: dailyStats,
    totalActivities: stats.reduce((sum, stat) => sum + stat.count, 0),
    totalWatchTime: stats.reduce((sum, stat) => sum + (stat.totalWatchTime || 0), 0)
  };
};

// Static method to calculate learning streak
learningActivitySchema.statics.calculateLearningStreak = async function(userId: string) {
  const activities = await this.find({
    user: userId,
    type: { $in: ['lesson_complete', 'course_complete'] }
  })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();
    
  if (activities.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  let lastDate = new Date(activities[0].createdAt);
  lastDate.setHours(0, 0, 0, 0);
  
  // Check if today has activity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime()) {
    currentStreak = 1;
  }
  
  // Calculate streaks
  for (let i = 1; i < activities.length; i++) {
    const currentDate = new Date(activities[i].createdAt);
    currentDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      tempStreak++;
      if (i === 1) currentStreak = tempStreak;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
      if (i === 1) currentStreak = 0;
    }
    
    lastDate = currentDate;
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { currentStreak, longestStreak };
};

const LearningActivity = mongoose.model<ILearningActivity>('LearningActivity', learningActivitySchema);

export default LearningActivity;
