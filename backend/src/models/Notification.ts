import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for static methods
interface INotificationModel extends Model<INotification> {
  createAssignmentSubmissionNotification(data: {
    instructorId: string;
    studentName: string;
    courseName: string;
    lessonName: string;
    assignmentName: string;
    submissionId: string;
    score: number;
    percentage: number;
    attemptNumber: number;
    assignmentId: string;
    courseId: string;
  }): Promise<INotification>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notificationIds?: string[]): Promise<any>;
  getNotificationsForUser(userId: string, options?: any): Promise<any>;
}

export interface INotification extends Document {
  _id: string;
  recipient: mongoose.Types.ObjectId;
  type: 'assignment_submission' | 'assignment_graded' | 'course_enrollment' | 'lesson_completed' | 'system' | 'announcement';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId; // Can reference assignment, course, lesson, etc.
  relatedType?: 'assignment' | 'course' | 'lesson' | 'user' | 'submission';
  metadata?: {
    studentName?: string;
    courseName?: string;
    lessonName?: string;
    assignmentName?: string;
    submissionId?: string;
    score?: number;
    percentage?: number;
    attemptNumber?: number;
  };
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string; // URL to navigate when notification is clicked
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsRead(): Promise<INotification>;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['assignment_submission', 'assignment_graded', 'course_enrollment', 'lesson_completed', 'system', 'announcement'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  relatedType: {
    type: String,
    enum: ['assignment', 'course', 'lesson', 'user', 'submission']
  },
  metadata: {
    studentName: String,
    courseName: String,
    lessonName: String,
    assignmentName: String,
    submissionId: String,
    score: Number,
    percentage: Number,
    attemptNumber: Number
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, isRead: 1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Pre-save middleware to mark as read when readAt is set
notificationSchema.pre('save', function(next) {
  if (this.readAt && !this.isRead) {
    this.isRead = true;
  }
  next();
});

// Static method to create assignment submission notification
notificationSchema.statics.createAssignmentSubmissionNotification = async function(data: {
  instructorId: string;
  studentName: string;
  courseName: string;
  lessonName: string;
  assignmentName: string;
  submissionId: string;
  score: number;
  percentage: number;
  attemptNumber: number;
  assignmentId: string;
  courseId: string;
}) {
  const notification = new this({
    recipient: data.instructorId,
    type: 'assignment_submission',
    title: 'New Assignment Submission',
    message: `${data.studentName} has submitted "${data.assignmentName}" in ${data.courseName}`,
    relatedId: data.submissionId,
    relatedType: 'submission',
    metadata: {
      studentName: data.studentName,
      courseName: data.courseName,
      lessonName: data.lessonName,
      assignmentName: data.assignmentName,
      submissionId: data.submissionId,
      score: data.score,
      percentage: data.percentage,
      attemptNumber: data.attemptNumber
    },
    priority: 'medium',
    actionUrl: `/instructor/courses/${data.courseId}/assignments/${data.assignmentId}/submissions`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId: string) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId: string, notificationIds?: string[]) {
  const query: any = { recipient: userId, isRead: false };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return await this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getNotificationsForUser = async function(
  userId: string, 
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const query: any = {
    recipient: userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(query);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);

export default Notification;
