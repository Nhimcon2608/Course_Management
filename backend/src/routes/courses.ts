import express from 'express';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Category from '@/models/Category';
import Review from '@/models/Review';
import Order from '@/models/Order';
import User from '@/models/User';
import { auth, optionalAuth, requireAdmin } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = express.Router();

// Helper function to build query for finding course by ID or slug
const buildCourseQuery = (id: string, additionalFilters: any = {}) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

  if (isValidObjectId) {
    // If it's a valid ObjectId, search by both _id and slug
    return {
      $or: [{ _id: id }, { slug: id }],
      ...additionalFilters
    };
  } else {
    // If it's not a valid ObjectId, only search by slug
    return {
      slug: id,
      ...additionalFilters
    };
  }
};

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of courses per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      level,
      minPrice,
      maxPrice,
      search,
      sortBy = 'popular',
      featured,
      instructor
    } = req.query;

    // Build filter object
    const filter: any = {
      isPublished: true,
      status: 'published'
    };

    if (category) {
      filter.category = category;
    }

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

    if (featured === 'true') {
      filter.featured = true;
    }

    if (instructor) {
      filter.instructor = instructor;
    }

    // Build sort object
    let sort: any = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1, totalRatings: -1 };
        break;
      case 'popular':
      default:
        sort = { enrolledStudents: -1, rating: -1 };
        break;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
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

    res.json({
      success: true,
      data: {
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
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - instructor
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               category:
 *                 type: string
 *               instructor:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               language:
 *                 type: string
 *               duration:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               whatYouWillLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *               lessons:
 *                 type: array
 *                 items:
 *                   type: object
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               isPublished:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      category,
      instructor,
      price,
      discountPrice,
      thumbnail,
      level = 'beginner',
      language = 'vi',
      duration = 0,
      tags = [],
      requirements = [],
      whatYouWillLearn = [],
      lessons = [],
      status = 'draft',
      isPublished = false,
      isFeatured = false
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !instructor) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, category, instructor'
      });
      return;
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    // Validate instructor exists and has instructor role
    const instructorExists = await User.findOne({
      _id: instructor,
      role: 'instructor',
      isActive: true
    });
    if (!instructorExists) {
      res.status(400).json({
        success: false,
        message: 'Invalid instructor ID or instructor is not active'
      });
      return;
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug });
    if (existingCourse) {
      res.status(400).json({
        success: false,
        message: 'A course with this title already exists'
      });
      return;
    }

    // Create course
    const course = new Course({
      title,
      slug,
      description,
      shortDescription,
      category,
      instructor,
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      thumbnail,
      level,
      language,
      duration: Number(duration) || 0,
      tags,
      requirements,
      whatYouWillLearn,
      lessons,
      status,
      isPublished,
      isFeatured,
      enrolledStudents: 0,
      rating: 0,
      totalRatings: 0
    });

    await course.save();

    // Populate the course with category and instructor details
    const populatedCourse = await Course.findById(course._id)
      .populate('category', 'name slug description icon color')
      .populate('instructor', 'name email avatar bio');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: populatedCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               category:
 *                 type: string
 *               instructor:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *               language:
 *                 type: string
 *               duration:
 *                 type: number
 *               tags:
 *                 type: array
 *               requirements:
 *                 type: array
 *               whatYouWillLearn:
 *                 type: array
 *               lessons:
 *                 type: array
 *               status:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/:id', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Validate category if provided
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }
    }

    // Validate instructor if provided
    if (updateData.instructor) {
      const instructorExists = await User.findOne({
        _id: updateData.instructor,
        role: 'instructor',
        isActive: true
      });
      if (!instructorExists) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID or instructor is not active'
        });
        return;
      }
    }

    // Update slug if title is changed
    if (updateData.title && updateData.title !== course.title) {
      const newSlug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists
      const existingCourse = await Course.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingCourse) {
        res.status(400).json({
          success: false,
          message: 'A course with this title already exists'
        });
        return;
      }
      updateData.slug = newSlug;
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug description icon color')
      .populate('instructor', 'name email avatar bio');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Check if course has enrolled students
    if (course.enrolledStudents > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete course with enrolled students'
      });
      return;
    }

    // Delete the course
    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Build base query
    let query = buildCourseQuery(id);

    // If user is not authenticated or not the instructor, only show published courses
    if (!userId) {
      query = buildCourseQuery(id, {
        isPublished: true,
        status: 'published'
      });
    } else {
      // If user is authenticated, check if they are the instructor
      const courseCheck = await Course.findOne(buildCourseQuery(id)).select('instructor').lean();

      if (!courseCheck) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      // If user is not the instructor, only show published courses
      if (courseCheck.instructor.toString() !== userId.toString()) {
        query = buildCourseQuery(id, {
          isPublished: true,
          status: 'published'
        });
      }
      // If user is the instructor, they can see their own unpublished courses
    }

    const course = await Course.findOne(query)
      .populate('instructor', 'name email avatar bio expertise socialLinks')
      .populate('category', 'name slug description icon color')
      .lean();

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Get course reviews
    const reviews = await Review.find({ course: course._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get related courses (same category, excluding current course)
    const relatedCourses = await Course.find({
      category: course.category,
      _id: { $ne: course._id },
      isPublished: true,
      status: 'published'
    })
      .populate('instructor', 'name')
      .populate('category', 'name')
      .sort({ rating: -1, enrolledStudents: -1 })
      .limit(4)
      .lean();

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (req.user) {
      // Find the latest enrollment for this course
      const latestEnrollment = await Order.findOne({
        user: req.user._id,
        'courses.course': course._id,
        $or: [
          { paymentStatus: 'paid' },
          { paymentMethod: 'instructor_enrollment' }
        ]
      }).sort({ createdAt: -1 }); // Get the most recent enrollment

      // User is enrolled only if latest enrollment is completed (not cancelled)
      isEnrolled = !!(latestEnrollment && latestEnrollment.status === 'completed');
    }

    res.json({
      success: true,
      data: {
        course,
        reviews,
        relatedCourses,
        isEnrolled
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/courses/:id/reviews - Fetch course reviews with pagination
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // First find the course to get its ObjectId
    const query = buildCourseQuery(id, {
      isPublished: true,
      status: 'published'
    });

    const course = await Course.findOne(query).select('_id');

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    const filter: any = { course: course._id };
    if (rating) {
      filter.rating = Number(rating);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        reviews,
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
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/courses/:id/enroll - Enroll in a course
router.post('/:id/enroll', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const query = buildCourseQuery(id, {
      isPublished: true,
      status: 'published'
    });

    const course = await Course.findOne(query);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // TODO: Implement enrollment logic
    // 1. Check if user is already enrolled
    // 2. Create order/payment if course is paid
    // 3. Create progress record
    // 4. Update course enrolled students count

    res.json({
      success: true,
      message: 'Enrollment functionality will be implemented in Phase 4',
      data: {
        courseId: course._id,
        userId
      }
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
