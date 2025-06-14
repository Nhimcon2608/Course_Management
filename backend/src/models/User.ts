import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '@/types';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  address: {
    type: String,
    trim: true,
    default: null
  },
  city: {
    type: String,
    trim: true,
    default: null
  },
  country: {
    type: String,
    trim: true,
    default: 'Vietnam'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: [0, 'Login attempts cannot be negative']
  },
  lockUntil: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Instructor-specific fields
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: null
  },
  expertise: [{
    type: String,
    trim: true,
    maxlength: [100, 'Expertise area cannot exceed 100 characters']
  }],
  qualifications: [{
    type: String,
    trim: true,
    maxlength: [200, 'Qualification cannot exceed 200 characters']
  }],
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50'],
    default: null
  },
  socialLinks: {
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL']
    },
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    }
  },
  // Email verification fields
  emailVerificationToken: {
    type: String,
    default: null,
    select: false // Don't include in queries by default
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
    select: false // Don't include in queries by default
  },
  // Password reset fields
  passwordResetToken: {
    type: String,
    default: null,
    select: false // Don't include in queries by default
  },
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false // Don't include in queries by default
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Index for better performance (email already has unique index)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ emailVerificationExpires: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ passwordResetExpires: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, (this as any).password);
  } catch (error) {
    return false;
  }
};

// Update lastLogin when user logs in
userSchema.methods.updateLastLogin = function() {
  (this as any).lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Check if account is locked
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts and lock account if necessary
userSchema.methods.incLoginAttempts = async function(): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 1000; // 2 minutes

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // If we have hit max attempts and it's not locked yet, lock the account
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const crypto = require('crypto');

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and save to database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expiration time (15 minutes)
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  // Return the unhashed token (this will be sent via email)
  return resetToken;
};

// Clear password reset token
userSchema.methods.clearPasswordResetToken = function(): void {
  // Clear the fields on the current document instance
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const crypto = require('crypto');

  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  console.log(`🔑 Generated raw token: ${verificationToken}`);

  // Hash the token and save to database
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationToken = hashedToken;
  console.log(`🔒 Hashed token for DB: ${hashedToken}`);

  // Set expiration time (24 hours)
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Return the unhashed token (this will be sent via email)
  return verificationToken;
};

// Clear email verification token
userSchema.methods.clearEmailVerificationToken = function(): void {
  // Clear the fields on the current document instance
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
};

// Virtual for full name (if needed later)
userSchema.virtual('initials').get(function() {
  return (this as any).name
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
