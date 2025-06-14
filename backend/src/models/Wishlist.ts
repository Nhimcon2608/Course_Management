import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  courses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  courseCount: number;

  // Instance methods
  addCourse(courseId: string): Promise<any>;
  removeCourse(courseId: string): Promise<any>;
  hasCourse(courseId: string): boolean;
  getCourseCount(): number;
}

const wishlistSchema = new Schema<IWishlist>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
wishlistSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ user: 1, courses: 1 });
wishlistSchema.index({ courses: 1 });

// Virtual for course count
wishlistSchema.virtual('courseCount').get(function() {
  return this.courses.length;
});

// Instance method to add course to wishlist
wishlistSchema.methods.addCourse = async function(courseId: string) {
  // Check if course already exists
  if (!this.hasCourse(courseId)) {
    this.courses.push(new mongoose.Types.ObjectId(courseId));
    await this.save();
  }
  return this;
};

// Instance method to remove course from wishlist
wishlistSchema.methods.removeCourse = async function(courseId: string) {
  this.courses = this.courses.filter(
    (course: mongoose.Types.ObjectId) => course.toString() !== courseId
  );
  await this.save();
  return this;
};

// Instance method to check if course exists in wishlist
wishlistSchema.methods.hasCourse = function(courseId: string): boolean {
  return this.courses.some(
    (course: mongoose.Types.ObjectId) => course.toString() === courseId
  );
};

// Instance method to get course count
wishlistSchema.methods.getCourseCount = function(): number {
  return this.courses.length;
};

// Static method to find or create wishlist for user
wishlistSchema.statics.findOrCreateForUser = async function(userId: string) {
  let wishlist = await this.findOne({ user: userId }).populate({
    path: 'courses',
    select: 'title slug price originalPrice thumbnail instructor category level duration rating totalRatings language certificate featured status',
    populate: [
      { path: 'instructor', select: 'name' },
      { path: 'category', select: 'name slug' }
    ]
  });

  if (!wishlist) {
    wishlist = new this({ user: userId, courses: [] });
    await wishlist.save();
    // Populate after creation
    await wishlist.populate({
      path: 'courses',
      select: 'title slug price originalPrice thumbnail instructor category level duration rating totalRatings language certificate featured status',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name slug' }
      ]
    });
  }

  return wishlist;
};

// Static method to get wishlist statistics
wishlistSchema.statics.getWishlistStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalWishlists: { $sum: 1 },
        totalCourses: { $sum: { $size: '$courses' } },
        averageCoursesPerWishlist: { $avg: { $size: '$courses' } }
      }
    }
  ]);

  return stats[0] || {
    totalWishlists: 0,
    totalCourses: 0,
    averageCoursesPerWishlist: 0
  };
};

// Add static methods to interface
interface WishlistModel extends mongoose.Model<IWishlist> {
  findOrCreateForUser(userId: string): Promise<IWishlist>;
  getWishlistStats(): Promise<any>;
}

const Wishlist = mongoose.model<IWishlist, WishlistModel>('Wishlist', wishlistSchema);

export default Wishlist;
