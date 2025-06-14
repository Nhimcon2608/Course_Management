import mongoose, { Schema } from 'mongoose';
import { ICourse } from '@/types';

const lessonSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Lesson title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Lesson description cannot exceed 1000 characters']
  },
  videoUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Lesson duration is required'],
    min: [1, 'Lesson duration must be at least 1 minute']
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
    min: [1, 'Lesson order must be at least 1']
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    }
  }]
}, { _id: true });

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [5, 'Course title must be at least 5 characters'],
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    minlength: [50, 'Course description must be at least 50 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    minlength: [20, 'Short description must be at least 20 characters'],
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    set: (value: number) => Math.round(value * 100) / 100 // Round to 2 decimal places
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    set: (value: number) => value ? Math.round(value * 100) / 100 : value
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required'],
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  level: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Level must be beginner, intermediate, or advanced'
    },
    required: [true, 'Course level is required']
  },
  duration: {
    type: Number,
    required: [true, 'Course duration is required'],
    min: [0.5, 'Course duration must be at least 0.5 hours']
  },
  lessons: [lessonSchema],
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  whatYouWillLearn: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [300, 'Learning outcome cannot exceed 300 characters']
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  enrolledStudents: {
    type: Number,
    default: 0,
    min: [0, 'Enrolled students cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    set: (value: number) => Math.round(value * 10) / 10 // Round to 1 decimal place
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  language: {
    type: String,
    default: 'english',
    enum: ['english', 'vietnamese', 'en', 'vi'],
    trim: true
  },
  subtitles: [{
    type: String,
    trim: true
  }],
  certificate: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
courseSchema.index({ title: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ enrolledStudents: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ isPublished: 1, status: 1 });
courseSchema.index({ featured: 1 });

// Virtual for total lesson count
courseSchema.virtual('totalLessons').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

// Virtual for total course duration in minutes
courseSchema.virtual('totalDurationMinutes').get(function() {
  return this.lessons ? this.lessons.reduce((total, lesson) => total + lesson.duration, 0) : 0;
});

// Virtual for discount percentage
courseSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Pre-save middleware to generate slug
courseSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Static method to find published courses
courseSchema.statics.findPublished = function() {
  return this.find({ isPublished: true, status: 'published' });
};

// Instance method to calculate average rating
courseSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { course: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.rating = Math.round(stats[0].averageRating * 10) / 10;
    this.totalRatings = stats[0].totalRatings;
  } else {
    this.rating = 0;
    this.totalRatings = 0;
  }

  await this.save();
};

const Course = mongoose.model<ICourse>('Course', courseSchema);

export default Course;
