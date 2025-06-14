import mongoose, { Schema } from 'mongoose';
import { ICart } from '@/types';

const cartItemSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  totalOriginalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total original amount cannot be negative']
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
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.course': 1 });
cartSchema.index({ expiresAt: 1 });

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Virtual for total savings
cartSchema.virtual('totalSavings').get(function() {
  return this.totalOriginalAmount - this.totalAmount;
});

// Virtual for final amount after discount
cartSchema.virtual('finalAmount').get(function() {
  return Math.max(0, this.totalAmount - this.discountAmount);
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => total + item.price, 0);
    this.totalOriginalAmount = this.items.reduce((total, item) => {
      return total + (item.originalPrice || item.price);
    }, 0);
  }
  next();
});

// Instance method to add course to cart
cartSchema.methods.addCourse = async function(courseId: string, price: number, originalPrice?: number) {
  // Check if course already exists in cart
  const existingItemIndex = this.items.findIndex(
    (item: any) => item.course.toString() === courseId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].price = price;
    this.items[existingItemIndex].originalPrice = originalPrice;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      course: courseId,
      price,
      originalPrice,
      addedAt: new Date()
    });
  }

  // Reset expiration
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await this.save();
  return this;
};

// Instance method to remove course from cart
cartSchema.methods.removeCourse = async function(courseId: string) {
  this.items = this.items.filter((item: any) => item.course.toString() !== courseId);
  await this.save();
  return this;
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.couponCode = undefined;
  this.discountAmount = 0;
  await this.save();
  return this;
};

// Instance method to apply coupon
cartSchema.methods.applyCoupon = async function(couponCode: string, discountAmount: number) {
  this.couponCode = couponCode;
  this.discountAmount = Math.min(discountAmount, this.totalAmount);
  await this.save();
  return this;
};

// Instance method to remove coupon
cartSchema.methods.removeCoupon = async function() {
  this.couponCode = undefined;
  this.discountAmount = 0;
  await this.save();
  return this;
};

// Instance method to check if course exists in cart
cartSchema.methods.hasCourse = function(courseId: string): boolean {
  return this.items.some((item: any) => item.course.toString() === courseId);
};

// Instance method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    totalOriginalAmount: this.totalOriginalAmount,
    totalSavings: this.totalSavings,
    discountAmount: this.discountAmount,
    finalAmount: this.finalAmount,
    couponCode: this.couponCode
  };
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId: string) {
  let cart = await this.findOne({ user: userId }).populate('items.course');

  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }

  return cart;
};

// Add static method to interface
interface CartModel extends mongoose.Model<ICart> {
  findOrCreateForUser(userId: string): Promise<ICart>;
  cleanupExpiredCarts(): Promise<number>;
  getCartStats(): Promise<any>;
}

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpiredCarts = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// Static method to get cart statistics
cartSchema.statics.getCartStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        totalValue: { $sum: '$totalAmount' },
        averageCartValue: { $avg: '$totalAmount' },
        averageItemsPerCart: { $avg: { $size: '$items' } }
      }
    }
  ]);

  return stats[0] || {
    totalCarts: 0,
    totalItems: 0,
    totalValue: 0,
    averageCartValue: 0,
    averageItemsPerCart: 0
  };
};

const Cart = mongoose.model<ICart, CartModel>('Cart', cartSchema);

export default Cart;
