import mongoose, { Schema } from 'mongoose';
import { IReview } from '@/types';

const reviewSchema = new Schema<IReview>({
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value);
      },
      message: 'Rating must be a whole number'
    }
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Review title cannot exceed 200 characters']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [2000, 'Review comment cannot exceed 2000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro point cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con point cannot exceed 200 characters']
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: [0, 'Total votes cannot be negative']
  },
  votedBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'not_helpful']
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  originalReview: {
    rating: Number,
    title: String,
    comment: String,
    editedAt: Date
  },
  replies: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters']
    },
    isInstructor: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ helpfulVotes: -1 });

// Virtual for helpfulness percentage
reviewSchema.virtual('helpfulnessPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100);
});

// Virtual for review age in days
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to check verified purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if user has purchased the course
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      user: this.user,
      'courses.course': this.course,
      status: 'completed'
    });
    
    this.isVerifiedPurchase = !!order;
  }
  next();
});

// Post-save middleware to update course rating
reviewSchema.post('save', async function() {
  try {
    const Course = mongoose.model('Course');
    // this.course should always be ObjectId in Review documents
    const course = await Course.findById(this.course);
    if (course) {
      await course.calculateAverageRating();
    }
  } catch (error) {
    console.error('Error in Review post-save middleware:', error);
  }
});

// Post-remove middleware to update course rating
reviewSchema.post('deleteOne', { document: true, query: false }, async function() {
  try {
    const Course = mongoose.model('Course');
    // this.course should always be ObjectId in Review documents
    const course = await Course.findById(this.course);
    if (course) {
      await course.calculateAverageRating();
    }
  } catch (error) {
    console.error('Error in Review post-remove middleware:', error);
  }
});

// Instance method to vote on review
reviewSchema.methods.vote = async function(userId: string, voteType: 'helpful' | 'not_helpful') {
  // Remove existing vote from this user
  this.votedBy = this.votedBy.filter((vote: any) => vote.user.toString() !== userId);
  
  // Add new vote
  this.votedBy.push({
    user: userId,
    vote: voteType,
    votedAt: new Date()
  });
  
  // Recalculate vote counts
  this.helpfulVotes = this.votedBy.filter((vote: any) => vote.vote === 'helpful').length;
  this.totalVotes = this.votedBy.length;
  
  await this.save();
  return this;
};

// Instance method to add reply
reviewSchema.methods.addReply = async function(userId: string, content: string, isInstructor: boolean = false) {
  this.replies.push({
    user: userId,
    content,
    isInstructor,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

// Instance method to edit review
reviewSchema.methods.editReview = async function(updates: { rating?: number; title?: string; comment?: string }) {
  // Store original review if this is the first edit
  if (!this.isEdited) {
    this.originalReview = {
      rating: this.rating,
      title: this.title,
      comment: this.comment,
      editedAt: new Date()
    };
  }
  
  // Update review
  if (updates.rating !== undefined) this.rating = updates.rating;
  if (updates.title !== undefined) this.title = updates.title;
  if (updates.comment !== undefined) this.comment = updates.comment;
  
  this.isEdited = true;
  this.editedAt = new Date();
  
  await this.save();
  return this;
};

// Instance method to moderate review
reviewSchema.methods.moderate = async function(status: string, moderatorId: string, notes?: string) {
  this.status = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  if (notes) {
    this.moderationNotes = notes;
  }
  
  await this.save();
  return this;
};

// Static method to get review statistics for a course
reviewSchema.statics.getCourseReviewStats = async function(courseId: string) {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const result = stats[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.ratingDistribution.forEach((rating: number) => {
    distribution[rating as keyof typeof distribution]++;
  });

  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution
  };
};

// Static method to get user review statistics
reviewSchema.statics.getUserReviewStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalHelpfulVotes: { $sum: '$helpfulVotes' }
      }
    }
  ]);

  return stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    totalHelpfulVotes: 0
  };
};

// Static method to get trending reviews
reviewSchema.statics.getTrendingReviews = async function(limit: number = 10) {
  return this.find({ status: 'approved' })
    .sort({ helpfulVotes: -1, createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('course', 'title thumbnail');
};

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
