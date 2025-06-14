import mongoose, { Schema } from 'mongoose';
import { ICategory } from '@/types';

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Category description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Category level cannot be negative'],
    max: [5, 'Category level cannot exceed 5']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  courseCount: {
    type: Number,
    default: 0,
    min: [0, 'Course count cannot be negative']
  },
  metadata: {
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title cannot exceed 60 characters']
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ featured: 1 });
categorySchema.index({ order: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for courses in this category
categorySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'category'
});

// Virtual for full path (breadcrumb)
categorySchema.virtual('path').get(function() {
  // This will be populated by a method
  return (this as any)._path || [];
});

// Pre-save middleware to generate slug and set level
categorySchema.pre('save', async function(next) {
  // Generate slug from name
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Set level based on parent category
  if (this.isModified('parentCategory') || this.level === undefined) {
    if (this.parentCategory) {
      const parent = await mongoose.model('Category').findById(this.parentCategory);
      if (parent) {
        this.level = parent.level + 1;
      }
    } else {
      this.level = 0;
    }
  }

  next();
});

// Pre-remove middleware to handle subcategories
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // Move subcategories to parent or make them root categories
  await mongoose.model('Category').updateMany(
    { parentCategory: this._id },
    { parentCategory: this.parentCategory }
  );
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ level: 1, order: 1, name: 1 })
    .lean();

  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // Create map of all categories
  categories.forEach((category: any) => {
    categoryMap.set(category._id.toString(), { ...category, children: [] });
  });

  // Build tree structure
  categories.forEach((category: any) => {
    const categoryNode = categoryMap.get(category._id.toString());

    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory.toString());
      if (parent) {
        parent.children.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
};

// Static method to get category path
categorySchema.statics.getCategoryPath = async function(categoryId: string) {
  const path: any[] = [];
  let currentCategory = await this.findById(categoryId);

  while (currentCategory) {
    path.unshift({
      _id: currentCategory._id,
      name: currentCategory.name,
      slug: currentCategory.slug
    });

    if (currentCategory.parentCategory) {
      currentCategory = await this.findById(currentCategory.parentCategory);
    } else {
      currentCategory = null;
    }
  }

  return path;
};

// Instance method to get all descendant categories
categorySchema.methods.getDescendants = async function() {
  const descendants: any[] = [];
  
  const findChildren = async (parentId: string) => {
    const children = await mongoose.model('Category').find({ parentCategory: parentId });
    
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id.toString());
    }
  };

  await findChildren(this._id.toString());
  return descendants;
};

// Instance method to update course count
categorySchema.methods.updateCourseCount = async function() {
  const Course = mongoose.model('Course');
  const count = await Course.countDocuments({ 
    category: this._id, 
    isPublished: true,
    status: 'published'
  });
  
  this.courseCount = count;
  await this.save();
};

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
