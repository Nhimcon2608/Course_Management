import mongoose, { Schema } from 'mongoose';
import { IAchievement } from '@/types';

const achievementSchema = new Schema<IAchievement>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: ['course_completion', 'learning_streak', 'first_course', 'milestone', 'certificate'],
    required: [true, 'Achievement type is required']
  },
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    required: [true, 'Achievement icon is required'],
    trim: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  },
  metadata: {
    streakDays: {
      type: Number,
      min: [0, 'Streak days cannot be negative']
    },
    coursesCompleted: {
      type: Number,
      min: [0, 'Courses completed cannot be negative']
    },
    hoursLearned: {
      type: Number,
      min: [0, 'Hours learned cannot be negative']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
achievementSchema.index({ user: 1, type: 1 });
achievementSchema.index({ user: 1, earnedAt: -1 });
achievementSchema.index({ type: 1 });

// Static methods for creating achievements
achievementSchema.statics.createCourseCompletionAchievement = async function(userId: string, courseId: string) {
  const achievement = new this({
    user: userId,
    course: courseId,
    type: 'course_completion',
    title: 'Course Completed!',
    description: 'Congratulations on completing your course!',
    icon: '🎓'
  });
  
  return await achievement.save();
};

achievementSchema.statics.createFirstCourseAchievement = async function(userId: string, courseId: string) {
  const achievement = new this({
    user: userId,
    course: courseId,
    type: 'first_course',
    title: 'First Course!',
    description: 'Welcome to your learning journey! You\'ve completed your first course.',
    icon: '🌟'
  });
  
  return await achievement.save();
};

achievementSchema.statics.createLearningStreakAchievement = async function(userId: string, streakDays: number) {
  const achievement = new this({
    user: userId,
    type: 'learning_streak',
    title: `${streakDays} Day Streak!`,
    description: `Amazing! You've maintained a ${streakDays}-day learning streak.`,
    icon: '🔥',
    metadata: { streakDays }
  });
  
  return await achievement.save();
};

achievementSchema.statics.createMilestoneAchievement = async function(userId: string, milestone: string, count: number) {
  let title = '';
  let description = '';
  let icon = '';
  
  switch (milestone) {
    case 'courses_completed':
      title = `${count} Courses Completed!`;
      description = `Fantastic! You've completed ${count} courses.`;
      icon = '📚';
      break;
    case 'hours_learned':
      title = `${count} Hours of Learning!`;
      description = `Incredible! You've spent ${count} hours learning.`;
      icon = '⏰';
      break;
    default:
      title = 'Milestone Achieved!';
      description = 'You\'ve reached an important milestone in your learning journey.';
      icon = '🏆';
  }
  
  const achievement = new this({
    user: userId,
    type: 'milestone',
    title,
    description,
    icon,
    metadata: { [milestone]: count }
  });
  
  return await achievement.save();
};

achievementSchema.statics.createCertificateAchievement = async function(userId: string, courseId: string) {
  const achievement = new this({
    user: userId,
    course: courseId,
    type: 'certificate',
    title: 'Certificate Earned!',
    description: 'You\'ve earned a certificate for completing this course!',
    icon: '🏅'
  });
  
  return await achievement.save();
};

// Static method to get user achievements
achievementSchema.statics.getUserAchievements = async function(userId: string, limit?: number) {
  const query = this.find({ user: userId })
    .populate('course', 'title thumbnail')
    .sort({ earnedAt: -1 });
    
  if (limit) {
    query.limit(limit);
  }
  
  return await query.exec();
};

// Static method to get achievement statistics
achievementSchema.statics.getAchievementStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        latestEarned: { $max: '$earnedAt' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    courseCompletions: 0,
    learningStreaks: 0,
    milestones: 0,
    certificates: 0,
    firstCourse: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    switch (stat._id) {
      case 'course_completion':
        result.courseCompletions = stat.count;
        break;
      case 'learning_streak':
        result.learningStreaks = stat.count;
        break;
      case 'milestone':
        result.milestones = stat.count;
        break;
      case 'certificate':
        result.certificates = stat.count;
        break;
      case 'first_course':
        result.firstCourse = stat.count;
        break;
    }
  });
  
  return result;
};

const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);

export default Achievement;
