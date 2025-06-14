import mongoose, { Schema } from 'mongoose';
import { IOrder } from '@/types';

const orderItemSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  }
}, { _id: true });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required'],
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  courses: [orderItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR'],
    uppercase: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'],
      message: 'Status must be one of: pending, processing, completed, cancelled, refunded, failed'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['zalopay', 'stripe', 'paypal', 'bank_transfer', 'momo', 'vnpay', 'cash', 'instructor_enrollment'],
      message: 'Payment method must be one of: zalopay, stripe, paypal, bank_transfer, momo, vnpay, cash, instructor_enrollment'
    },
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
      message: 'Payment status must be one of: pending, processing, paid, failed, refunded, partially_refunded'
    },
    default: 'pending'
  },
  paymentId: {
    type: String,
    trim: true
  },
  paymentDetails: {
    transactionId: String,
    zaloPayTransId: String,
    zaloPayResponse: Schema.Types.Mixed,
    gatewayResponse: Schema.Types.Mixed,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    refundReason: String
  },
  billingAddress: {
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Vietnam'
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponId: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ completedAt: -1 });
orderSchema.index({ 'courses.course': 1 });
orderSchema.index({ 'paymentDetails.zaloPayTransId': 1 });
orderSchema.index({ couponId: 1 });

// Virtual for total items
orderSchema.virtual('totalItems').get(function() {
  return this.courses.length;
});

// Virtual for savings amount
orderSchema.virtual('savingsAmount').get(function() {
  const originalTotal = this.courses.reduce((total, item) => {
    return total + (item.originalPrice || item.price);
  }, 0);
  return originalTotal - this.subtotal;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  console.log('Pre-save middleware - orderNumber:', this.orderNumber);
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
    console.log('Generated orderNumber:', this.orderNumber);
  }
  next();
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  if (this.isModified('courses') || this.isModified('discountAmount') || this.isModified('taxAmount')) {
    // Calculate subtotal from courses
    this.subtotal = this.courses.reduce((total, item) => total + item.price, 0);

    // Calculate total amount
    this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;

    // Ensure total amount is not negative (prevent invalid data)
    if (this.totalAmount < 0) {
      console.warn(`Order ${this.orderNumber}: Total amount is negative (${this.totalAmount}). Setting to 0.`);
      this.totalAmount = 0;
    }
  }
  next();
});

// Static method to generate order statistics
orderSchema.statics.getOrderStats = async function(startDate?: Date, endDate?: Date) {
  const matchStage: any = { status: 'completed' };
  
  if (startDate && endDate) {
    matchStage.completedAt = { $gte: startDate, $lte: endDate };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalCoursesSold: { $sum: { $size: '$courses' } }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalCoursesSold: 0
  };
};

// Instance method to mark as completed
orderSchema.methods.markAsCompleted = async function() {
  this.status = 'completed';
  this.paymentStatus = 'paid';
  this.completedAt = new Date();
  
  // Update course enrollment counts
  const Course = mongoose.model('Course');
  for (const item of this.courses) {
    await Course.findByIdAndUpdate(
      item.course,
      { $inc: { enrolledStudents: 1 } }
    );
  }
  
  await this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = async function(reason?: string) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) {
    this.cancelReason = reason;
  }
  await this.save();
};

// Instance method to process refund
orderSchema.methods.processRefund = async function(amount?: number, reason?: string) {
  const refundAmount = amount || this.totalAmount;
  
  this.status = 'refunded';
  this.paymentStatus = amount === this.totalAmount ? 'refunded' : 'partially_refunded';
  this.paymentDetails.refundedAt = new Date();
  this.paymentDetails.refundAmount = refundAmount;
  if (reason) {
    this.paymentDetails.refundReason = reason;
  }
  
  await this.save();
};

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
