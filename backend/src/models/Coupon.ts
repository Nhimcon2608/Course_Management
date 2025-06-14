import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicableCourses: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isValid(): boolean;
  canBeUsed(): boolean;
  calculateDiscount(orderAmount: number): number;
  incrementUsage(): Promise<ICoupon>;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
    validate: {
      validator: function(this: ICoupon, value: number) {
        if (this.discountType === 'percentage') {
          return value <= 100;
        }
        return true;
      },
      message: 'Percentage discount cannot exceed 100%'
    }
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
    validate: {
      validator: function(this: ICoupon, value: number) {
        // Only required for percentage discounts
        if (this.discountType === 'percentage' && value === undefined) {
          return false;
        }
        return true;
      },
      message: 'Maximum discount is required for percentage coupons'
    }
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
    default: Date.now
  },
  validTo: {
    type: Date,
    required: [true, 'Valid to date is required'],
    validate: {
      validator: function(this: ICoupon, value: Date) {
        return value > this.validFrom;
      },
      message: 'Valid to date must be after valid from date'
    }
  },
  usageLimit: {
    type: Number,
    required: [true, 'Usage limit is required'],
    min: [1, 'Usage limit must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });
couponSchema.index({ createdBy: 1 });

// Virtual for remaining usage
couponSchema.virtual('remainingUsage').get(function() {
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Instance method to check if coupon is valid
couponSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validTo >= now;
};

// Instance method to check if coupon can be used
couponSchema.methods.canBeUsed = function(): boolean {
  return this.isValid() && this.usedCount < this.usageLimit;
};

// Instance method to calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount: number): number {
  if (!this.canBeUsed() || orderAmount < this.minOrderAmount) {
    return 0;
  }

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  // Ensure discount doesn't exceed order amount
  return Math.min(discount, orderAmount);
};

// Instance method to increment usage
couponSchema.methods.incrementUsage = async function(): Promise<ICoupon> {
  this.usedCount += 1;
  return await this.save();
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCoupon = function(code: string) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    $expr: { $lt: ['$usedCount', '$usageLimit'] }
  });
};

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon;
