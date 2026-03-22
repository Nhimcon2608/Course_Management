import mongoose, { Document, Schema } from 'mongoose';

export interface IInstructorApplication extends Document {
  _id: string;
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location: string;
  
  // Professional Information
  currentTitle: string;
  company?: string;
  experience: string;
  expertise: string[];
  bio: string;
  
  // Teaching Information
  teachingExperience?: string;
  motivation: string;
  sampleCourseTitle?: string;
  sampleCourseDescription?: string;
  
  // Social Links
  linkedin?: string;
  website?: string;
  github?: string;
  portfolio?: string;
  
  // Documents
  resume?: string; // File path or URL
  portfolio_url?: string;
  
  // Application Status
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string; // Admin user ID
  reviewedAt?: Date;
  
  // Additional Information
  hearAboutUs?: string;
  agreedToTerms: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const instructorApplicationSchema = new Schema<IInstructorApplication>({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Professional Information
  currentTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  expertise: [{
    type: String,
    required: true
  }],
  bio: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Teaching Information
  teachingExperience: {
    type: String,
    maxlength: 500
  },
  motivation: {
    type: String,
    required: true,
    maxlength: 1000
  },
  sampleCourseTitle: {
    type: String,
    maxlength: 200
  },
  sampleCourseDescription: {
    type: String,
    maxlength: 1000
  },
  
  // Social Links
  linkedin: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  
  // Documents
  resume: {
    type: String,
    trim: true
  },
  portfolio_url: {
    type: String,
    trim: true
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    maxlength: 1000
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  
  // Additional Information
  hearAboutUs: {
    type: String,
    maxlength: 200
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(v: boolean) {
        return v === true;
      },
      message: 'You must agree to the terms and conditions'
    }
  }
}, {
  timestamps: true
});

// Indexes
instructorApplicationSchema.index({ email: 1 });
instructorApplicationSchema.index({ status: 1 });
instructorApplicationSchema.index({ createdAt: -1 });
instructorApplicationSchema.index({ expertise: 1 });

// Virtual for full name
instructorApplicationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to approve application
instructorApplicationSchema.methods.approve = async function(reviewerId: string, notes?: string) {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  
  await this.save();
  
  // Here you would typically create an Instructor record and User account
  // This would be implemented in the service layer
};

// Method to reject application
instructorApplicationSchema.methods.reject = async function(reviewerId: string, notes: string) {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  
  await this.save();
};

// Static method to get pending applications
instructorApplicationSchema.statics.getPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to get applications by status
instructorApplicationSchema.statics.getByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Pre-save middleware to ensure email uniqueness for pending/approved applications
instructorApplicationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('email')) {
    const Model = this.constructor as any;
    const existingApp = await Model.findOne({
      email: this.email,
      status: { $in: ['pending', 'under_review', 'approved'] },
      _id: { $ne: this._id }
    });

    if (existingApp) {
      const error = new Error('An application with this email already exists');
      return next(error);
    }
  }
  next();
});

export default mongoose.model<IInstructorApplication>('InstructorApplication', instructorApplicationSchema);
