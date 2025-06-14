import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  _id: string;
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number; // in seconds
  videoSize?: number; // in bytes
  videoFormat?: string;
  order: number;
  duration: number; // estimated duration in minutes
  isPreview: boolean;
  isPublished: boolean;
  resources?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'link' | 'image' | 'other';
    size?: number;
  }>;
  assignments?: mongoose.Types.ObjectId[];
  completedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
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
  content: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  videoThumbnail: {
    type: String,
    trim: true
  },
  videoDuration: {
    type: Number,
    min: 0
  },
  videoSize: {
    type: Number,
    min: 0
  },
  videoFormat: {
    type: String,
    enum: ['mp4', 'webm', 'avi', 'mov', 'wmv'],
    lowercase: true
  },
  order: {
    type: Number,
    required: false, // Will be auto-assigned in pre-save middleware
    min: 1
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 600 // max 10 hours
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'link', 'image', 'other'],
      required: true
    },
    size: {
      type: Number,
      min: 0
    }
  }],
  assignments: [{
    type: Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  completedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ course: 1, isPublished: 1 });
lessonSchema.index({ course: 1, isPreview: 1 });

// Virtuals
lessonSchema.virtual('assignmentCount').get(function() {
  return this.assignments?.length || 0;
});

lessonSchema.virtual('completionCount').get(function() {
  return this.completedBy?.length || 0;
});

// Pre-save middleware
lessonSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Auto-assign order if not provided
      if (!this.order || this.order <= 0) {
        const LessonModel = this.constructor as any;
        const lastLesson = await LessonModel.findOne({ course: this.course })
          .sort({ order: -1 })
          .select('order')
          .lean();

        this.order = lastLesson ? lastLesson.order + 1 : 1;
        console.log(`Auto-assigned order ${this.order} for lesson: ${this.title}`);
      }
    }
    next();
  } catch (error) {
    console.error('Error in lesson pre-save middleware:', error);
    next(error as Error);
  }
});

// Static methods
lessonSchema.statics.reorderLessons = async function(courseId: string, lessonOrders: Array<{ lessonId: string, order: number }>) {
  const bulkOps = lessonOrders.map(({ lessonId, order }) => ({
    updateOne: {
      filter: { _id: lessonId, course: courseId },
      update: { order }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

lessonSchema.statics.getCourseLessons = function(courseId: string, includeUnpublished = false) {
  const query: any = { course: courseId };
  if (!includeUnpublished) {
    query.isPublished = true;
  }
  
  return this.find(query)
    .populate('assignments')
    .sort({ order: 1 });
};

const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema);

export default Lesson;
