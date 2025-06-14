import mongoose, { Schema } from 'mongoose';
import { ICertificate } from '@/types';

const certificateSchema = new Schema<ICertificate>({
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
  certificateNumber: {
    type: String,
    unique: true,
    required: [true, 'Certificate number is required'],
    trim: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: [true, 'Completion date is required']
  },
  grade: {
    type: Number,
    min: [0, 'Grade cannot be negative'],
    max: [100, 'Grade cannot exceed 100']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  instructorSignature: {
    type: String,
    trim: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  downloadUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
certificateSchema.index({ user: 1, course: 1 }, { unique: true });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ user: 1, issuedAt: -1 });
certificateSchema.index({ isValid: 1 });

// Pre-save middleware to generate certificate number
certificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await (this.constructor as any).countDocuments({
      issuedAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    
    this.certificateNumber = `CERT-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for certificate verification URL
certificateSchema.virtual('verificationUrl').get(function() {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/verify/${this.certificateNumber}`;
});

// Static method to issue certificate
certificateSchema.statics.issueCertificate = async function(userId: string, courseId: string, completionDate: Date, grade?: number) {
  // Check if certificate already exists
  const existingCertificate = await this.findOne({ user: userId, course: courseId });
  if (existingCertificate) {
    throw new Error('Certificate already issued for this course');
  }
  
  // Get course details for skills
  const Course = mongoose.model('Course');
  const course = await Course.findById(courseId).select('whatYouWillLearn instructor');
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  const certificate = new this({
    user: userId,
    course: courseId,
    completionDate,
    grade,
    skills: course.whatYouWillLearn || [],
    instructorSignature: course.instructor
  });
  
  return await certificate.save();
};

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = async function(certificateNumber: string) {
  const certificate = await this.findOne({ 
    certificateNumber, 
    isValid: true 
  })
    .populate('user', 'name email')
    .populate('course', 'title instructor duration')
    .lean();
    
  return certificate;
};

// Static method to get user certificates
certificateSchema.statics.getUserCertificates = async function(userId: string, limit?: number) {
  const query = this.find({ user: userId, isValid: true })
    .populate('course', 'title thumbnail instructor duration level')
    .sort({ issuedAt: -1 });
    
  if (limit) {
    query.limit(limit);
  }
  
  return await query.exec();
};

// Static method to revoke certificate
certificateSchema.statics.revokeCertificate = async function(certificateId: string, reason?: string) {
  const certificate = await this.findByIdAndUpdate(
    certificateId,
    { 
      isValid: false,
      revokedAt: new Date(),
      revokeReason: reason
    },
    { new: true }
  );
  
  return certificate;
};

// Static method to get certificate statistics
certificateSchema.statics.getCertificateStats = async function(userId?: string) {
  const matchStage = userId ? { user: new mongoose.Types.ObjectId(userId) } : {};
  
  const stats = await this.aggregate([
    { $match: { ...matchStage, isValid: true } },
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        averageGrade: { $avg: '$grade' },
        latestIssued: { $max: '$issuedAt' },
        earliestIssued: { $min: '$issuedAt' }
      }
    }
  ]);
  
  const monthlyStats = await this.aggregate([
    { $match: { ...matchStage, isValid: true } },
    {
      $group: {
        _id: {
          year: { $year: '$issuedAt' },
          month: { $month: '$issuedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  return {
    summary: stats[0] || {
      totalCertificates: 0,
      averageGrade: 0,
      latestIssued: null,
      earliestIssued: null
    },
    monthlyTrend: monthlyStats
  };
};

// Instance method to generate download URL
certificateSchema.methods.generateDownloadUrl = function() {
  // This would typically generate a signed URL for certificate download
  // For now, we'll return a placeholder URL
  return `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/certificates/${this._id}/download`;
};

// Instance method to invalidate certificate
certificateSchema.methods.invalidate = function(reason?: string) {
  this.isValid = false;
  this.revokedAt = new Date();
  this.revokeReason = reason;
  return this.save();
};

const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);

export default Certificate;
