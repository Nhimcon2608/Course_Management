import express from 'express';
import Category from '@/models/Category';
import Course from '@/models/Course';
import { optionalAuth } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false, featured, tree = false } = req.query;

    // Build filter
    const filter: any = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    if (tree === 'true') {
      // Return tree structure - build manually
      const allCategories = await Category.find(filter)
        .sort({ order: 1, name: 1 })
        .lean();

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // First pass: create map of all categories
      allCategories.forEach(cat => {
        categoryMap.set(cat._id.toString(), { ...cat, subcategories: [] });
      });

      // Second pass: build tree structure
      allCategories.forEach(cat => {
        const category = categoryMap.get(cat._id.toString());
        if (cat.parentCategory) {
          const parent = categoryMap.get(cat.parentCategory.toString());
          if (parent) {
            parent.subcategories.push(category);
          } else {
            rootCategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      res.json({
        success: true,
        data: {
          categories: rootCategories
        }
      });
    } else {
      // Return flat list with course counts
      const categories = await Category.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: 'category',
            as: 'courses'
          }
        },
        {
          $addFields: {
            courseCount: { $size: '$courses' }
          }
        },
        {
          $project: {
            courses: 0 // Remove the courses array, keep only the count
          }
        },
        { $sort: { order: 1, name: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          categories
        }
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/categories/:id - Get category by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includePath = false } = req.query;

    const category = await Category.findOne({
      $or: [{ _id: id }, { slug: id }],
      isActive: true
    })
      .populate('subcategories')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let categoryPath: any[] = [];
    if (includePath === 'true') {
      // Build category path manually
      const path = [];
      let currentCategory: any = category;

      while (currentCategory) {
        path.unshift({
          _id: currentCategory._id,
          name: currentCategory.name,
          slug: currentCategory.slug
        });

        if (currentCategory.parentCategory) {
          currentCategory = await Category.findById(currentCategory.parentCategory).lean();
        } else {
          break;
        }
      }
      categoryPath = path;
    }

    return res.json({
      success: true,
      data: {
        category,
        path: categoryPath
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/categories/:id/courses - Get courses by category
router.get('/:id/courses', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 12,
      level,
      minPrice,
      maxPrice,
      sortBy = 'popular',
      search
    } = req.query;

    // Find category
    const category = await Category.findOne({
      $or: [{ _id: id }, { slug: id }],
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get all descendant categories to include subcategory courses
    const descendants = await Category.find({
      parentCategory: category._id,
      isActive: true
    }).lean();
    const categoryIds = [category._id, ...descendants.map(d => d._id)];

    // Build filter object
    const filter: any = {
      category: { $in: categoryIds },
      isPublished: true,
      status: 'published'
    };

    if (level) {
      filter.level = level;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Build sort object
    let sort: any = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { rating: -1, totalRatings: -1 };
        break;
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'popular':
      default:
        sort = { enrolledStudents: -1, rating: -1 };
        break;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'name email avatar bio')
        .populate('category', 'name slug description icon color')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Get category path for breadcrumb - build manually
    const categoryPath = [];
    let currentCat: any = category;

    while (currentCat) {
      categoryPath.unshift({
        _id: currentCat._id,
        name: currentCat.name,
        slug: currentCat.slug
      });

      if (currentCat.parentCategory) {
        currentCat = await Category.findById(currentCat.parentCategory).lean();
      } else {
        break;
      }
    }

    return res.json({
      success: true,
      data: {
        category,
        categoryPath,
        courses,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching category courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category courses',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
