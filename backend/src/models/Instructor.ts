import mongoose, { Document, Schema } from 'mongoose';

export interface IInstructor extends Document {
  _id: string;
  userId: string; // Reference to User model
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  avatar?: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  experience: string;
  achievements: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  company?: string;
  location?: string;
  languages: string[];
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  featured: boolean;
  verified: boolean;
  joinedDate: Date;
  lastActive: Date;
  totalEarnings: number;
  responseTime: string; // e.g., "Usually responds within 2 hours"
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const instructorSchema = new Schema<IInstructor>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    required: true,
    maxlength: 1000
  },
  expertise: [{
    type: String,
    required: true
  }],
  avatar: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  studentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  coursesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  experience: {
    type: String,
    required: true
  },
  achievements: [{
    type: String
  }],
  socialLinks: {
    linkedin: { type: String, default: null },
    twitter: { type: String, default: null },
    website: { type: String, default: null },
    github: { type: String, default: null }
  },
  company: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  languages: [{
    type: String,
    default: ['English']
  }],
  hourlyRate: {
    type: Number,
    default: null,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  featured: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  responseTime: {
    type: String,
    default: 'Usually responds within 24 hours'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
instructorSchema.index({ userId: 1 });
instructorSchema.index({ expertise: 1 });
instructorSchema.index({ rating: -1 });
instructorSchema.index({ studentsCount: -1 });
instructorSchema.index({ featured: -1 });
instructorSchema.index({ status: 1 });
instructorSchema.index({ 'socialLinks.linkedin': 1 });

// Virtual for average rating calculation
instructorSchema.virtual('averageRating').get(function() {
  return Math.round(this.rating * 10) / 10;
});

// Method to update instructor stats
instructorSchema.methods.updateStats = async function() {
  // This would typically aggregate data from courses and enrollments
  // For now, we'll implement basic logic
  const Course = mongoose.model('Course');
  const courses = await Course.find({ instructorId: this._id });
  
  this.coursesCount = courses.length;
  this.studentsCount = courses.reduce((total, course) => total + (course.enrolledCount || 0), 0);
  
  await this.save();
};

// Static method to get featured instructors
instructorSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ featured: true, status: 'active' })
    .sort({ rating: -1, studentsCount: -1 })
    .limit(limit);
};

// Static method to search instructors
instructorSchema.statics.search = function(query: string, filters: any = {}) {
  const searchQuery: any = {
    status: 'active',
    ...filters
  };

  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { title: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } },
      { expertise: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  return this.find(searchQuery);
};

export default mongoose.model<IInstructor>('Instructor', instructorSchema);
