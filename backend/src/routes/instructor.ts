import express from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { authenticate, requireInstructor } from '@/middleware/auth';
import { sendSuccess, sendError } from '@/utils/response';
import Course from '@/models/Course';
import Order from '@/models/Order';
import Progress from '@/models/Progress';
import User from '@/models/User';
import { AuthRequest } from '@/types';
import lessonRoutes from './lessons';
import instructorSubmissionsRouter from './instructorSubmissions';

const router = express.Router();

// Apply authentication and instructor role check to all routes
router.use(authenticate);
router.use(requireInstructor);

/**
 * @swagger
 * /instructor/profile:
 *   get:
 *     summary: Get instructor profile
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;

    // Get instructor profile with teaching statistics
    const instructor = await User.findById(instructorId).select('-password');
    if (!instructor) {
      sendError(res, 'Instructor not found', 404);
      return;
    }

    // Get teaching statistics
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(course => course._id);

    // Get total students taught (from orders)
    const orders = await Order.find({
      'courses.course': { $in: courseIds },
      status: 'completed'
    }).populate('user', 'name email');

    const totalStudents = new Set(orders.map(order => order.user.toString())).size;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate average rating
    const publishedCourses = courses.filter(course => course.isPublished);
    const averageRating = publishedCourses.length > 0
      ? publishedCourses.reduce((sum, course) => sum + course.rating, 0) / publishedCourses.length
      : 0;

    const profileData = {
      ...instructor.toJSON(),
      teachingStats: {
        totalCourses: courses.length,
        publishedCourses: publishedCourses.length,
        totalStudents,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10
      }
    };

    sendSuccess(res, 'Profile retrieved successfully', { profile: profileData });
  } catch (error) {
    console.error('Get instructor profile error:', error);
    sendError(res, 'Failed to retrieve profile', 500);
  }
});

/**
 * @swagger
 * /instructor/profile:
 *   put:
 *     summary: Update instructor profile
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               yearsOfExperience:
 *                 type: number
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   github:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const {
      name,
      bio,
      phone,
      address,
      city,
      country,
      expertise,
      qualifications,
      yearsOfExperience,
      socialLinks
    } = req.body;

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    // Update instructor profile
    const updatedInstructor = await User.findByIdAndUpdate(
      instructorId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedInstructor) {
      sendError(res, 'Instructor not found', 404);
      return;
    }

    sendSuccess(res, 'Profile updated successfully', { profile: updatedInstructor });
  } catch (error) {
    console.error('Update instructor profile error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      sendError(res, 'Validation error: ' + error.message, 400);
    } else {
      sendError(res, 'Failed to update profile', 500);
    }
  }
});

/**
 * @swagger
 * /instructor/profile/avatar:
 *   post:
 *     summary: Upload instructor profile picture
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 */
router.post('/profile/avatar', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;

    // For now, return a mock response since we don't have file upload middleware set up
    // In a real implementation, you would use multer or similar for file handling
    const mockAvatarUrl = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&t=${Date.now()}`;

    // Update user avatar in database
    const updatedInstructor = await User.findByIdAndUpdate(
      instructorId,
      { avatar: mockAvatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedInstructor) {
      sendError(res, 'Instructor not found', 404);
      return;
    }

    sendSuccess(res, 'Profile picture updated successfully', {
      url: mockAvatarUrl,
      profile: updatedInstructor
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    sendError(res, 'Failed to upload profile picture', 500);
  }
});

/**
 * @swagger
 * tags:
 *   name: Instructor
 *   description: Instructor dashboard and management endpoints
 */

/**
 * @swagger
 * /instructor/stats:
 *   get:
 *     summary: Get instructor dashboard statistics
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor statistics retrieved successfully
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;

    // Get instructor's courses
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(course => course._id);

    // Get total students (unique enrollments across all courses)
    const enrollments = await Order.find({
      'courses.course': { $in: courseIds },
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: { $gte: 0 } // Exclude negative amounts
    }).populate('user', 'name email');

    const uniqueStudents = new Set(enrollments.map(order => order.user.toString()));
    const totalStudents = uniqueStudents.size;

    // Calculate total revenue (only from valid, paid orders)
    const totalRevenue = enrollments.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate average rating
    const coursesWithRatings = courses.filter(course => course.rating > 0);
    const averageRating = coursesWithRatings.length > 0
      ? coursesWithRatings.reduce((sum, course) => sum + course.rating, 0) / coursesWithRatings.length
      : 0;

    // Count published vs draft courses
    const publishedCourses = courses.filter(course => course.isPublished).length;
    const draftCourses = courses.filter(course => !course.isPublished).length;

    // Get monthly stats (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyEnrollments = await Order.countDocuments({
      'courses.course': { $in: courseIds },
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: { $gte: 0 },
      createdAt: { $gte: currentMonth }
    });

    const monthlyOrders = await Order.find({
      'courses.course': { $in: courseIds },
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: { $gte: 0 },
      createdAt: { $gte: currentMonth }
    });

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const stats = {
      totalCourses: courses.length,
      totalStudents,
      totalRevenue,
      averageRating,
      publishedCourses,
      draftCourses,
      monthlyRevenue,
      monthlyEnrollments
    };

    sendSuccess(res, 'Instructor statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Get instructor stats error:', error);
    sendError(res, 'Failed to retrieve instructor statistics', 500);
  }
});

/**
 * @swagger
 * /instructor/courses:
 *   get:
 *     summary: Get instructor's courses
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [published, draft, all]
 *           default: all
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor courses retrieved successfully
 */
router.get('/courses', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string || 'all';
    const search = req.query.search as string;

    // Build query
    const query: any = { instructor: instructorId };

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get courses with pagination
    const courses = await Course.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Course.countDocuments(query);

    sendSuccess(res, 'Instructor courses retrieved successfully', {
      courses,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    sendError(res, 'Failed to retrieve instructor courses', 500);
  }
});

/**
 * @swagger
 * /instructor/courses/{id}:
 *   get:
 *     summary: Get specific instructor course
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/courses/:id', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const courseId = req.params.id;

    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId
    }).populate('category', 'name');

    if (!course) {
      sendError(res, 'Course not found', 404);
      return;
    }

    sendSuccess(res, 'Course retrieved successfully', course);
  } catch (error) {
    console.error('Get instructor course error:', error);
    sendError(res, 'Failed to retrieve course', 500);
  }
});

/**
 * @swagger
 * /instructor/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Instructor]
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
 *               - shortDescription
 *               - category
 *               - price
 *               - level
 *               - duration
 *               - whatYouWillLearn
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               originalPrice:
 *                 type: number
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               duration:
 *                 type: number
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               whatYouWillLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/courses', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const courseData = req.body;

    // Generate slug from title
    const slug = courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create course with instructor ID
    const course = new Course({
      ...courseData,
      slug,
      instructor: instructorId,
      isPublished: false,
      status: 'draft'
    });

    await course.save();

    // Populate category for response
    await course.populate('category', 'name');

    sendSuccess(res, 'Course created successfully', course, 201);
  } catch (error: any) {
    console.error('Create course error:', error);
    if (error.name === 'ValidationError') {
      sendError(res, 'Invalid course data', 400, error.errors);
    } else if (error.code === 11000) {
      sendError(res, 'Course with this title already exists', 400);
    } else {
      sendError(res, 'Failed to create course', 500);
    }
  }
});

/**
 * @swagger
 * /instructor/courses/{id}:
 *   put:
 *     summary: Update instructor course
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
router.put('/courses/:id', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const courseId = req.params.id;
    const updateData = req.body;

    // If title is being updated, regenerate slug
    if (updateData.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructor: instructorId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!course) {
      sendError(res, 'Course not found', 404);
      return;
    }

    sendSuccess(res, 'Course updated successfully', course);
  } catch (error: any) {
    console.error('Update course error:', error);
    if (error.name === 'ValidationError') {
      sendError(res, 'Invalid course data', 400, error.errors);
    } else if (error.code === 11000) {
      sendError(res, 'Course with this title already exists', 400);
    } else {
      sendError(res, 'Failed to update course', 500);
    }
  }
});

/**
 * @swagger
 * /instructor/courses/{id}:
 *   delete:
 *     summary: Delete instructor course
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 */
router.delete('/courses/:id', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const courseId = req.params.id;

    // Check if course has enrollments
    const enrollmentCount = await Order.countDocuments({
      'courses.course': courseId,
      status: 'completed'
    });

    if (enrollmentCount > 0) {
      sendError(res, 'Cannot delete course with active enrollments. Archive it instead.', 400);
      return;
    }

    const course = await Course.findOneAndDelete({
      _id: courseId,
      instructor: instructorId
    });

    if (!course) {
      sendError(res, 'Course not found', 404);
      return;
    }

    sendSuccess(res, 'Course deleted successfully');
  } catch (error: any) {
    console.error('Delete course error:', error);
    sendError(res, 'Failed to delete course', 500);
  }
});

/**
 * @swagger
 * /instructor/students:
 *   get:
 *     summary: Get instructor's students
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.get('/students', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const courseId = req.query.courseId as string;
    const search = req.query.search as string;

    // Get instructor's courses
    let courseQuery: any = { instructor: instructorId };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery).select('_id title');
    const courseIds = courses.map(course => course._id);

    // Build enrollment query
    let enrollmentQuery: any = {
      'courses.course': { $in: courseIds },
      status: 'completed'
    };

    // Get enrollments with student info
    let enrollments = await Order.find(enrollmentQuery)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      enrollments = enrollments.filter(enrollment => {
        const user = enrollment.user as any;
        return user.name.toLowerCase().includes(search.toLowerCase()) ||
               user.email.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Get progress data for each enrollment
    const studentsWithProgress = await Promise.all(
      enrollments.slice(offset, offset + limit).map(async (enrollment) => {
        const user = enrollment.user as any;
        // Find the course from the enrollment that matches our instructor's courses
        const enrolledCourse = enrollment.courses.find((c: any) =>
          courseIds.some(courseId => courseId.toString() === c.course.toString())
        );

        if (!enrolledCourse) return null;

        const progress = await Progress.findOne({
          user: user._id,
          course: enrolledCourse.course
        });

        return {
          _id: enrollment._id,
          student: user,
          course: {
            _id: enrolledCourse.course,
            title: enrolledCourse.title || 'Unknown Course'
          },
          enrolledAt: enrollment.createdAt,
          progress: progress?.progressPercentage || 0,
          completedLessons: progress?.completedLessons?.length || 0,
          totalLessons: progress?.completedLessons?.length || 0,
          lastAccessedAt: progress?.lastAccessedAt
        };
      })
    );

    // Filter out null values
    const validStudents = studentsWithProgress.filter(student => student !== null);

    sendSuccess(res, 'Students retrieved successfully', {
      students: validStudents,
      total: enrollments.length
    });
  } catch (error: any) {
    console.error('Get instructor students error:', error);
    sendError(res, 'Failed to retrieve students', 500);
  }
});

/**
 * @swagger
 * /instructor/analytics:
 *   get:
 *     summary: Get instructor analytics
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const period = req.query.period as string || 'month';

    // Get instructor's courses
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(course => course._id);

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get revenue data by month
    const revenueData = await Order.aggregate([
      {
        $match: {
          'courses.course': { $in: courseIds },
          status: 'completed',
          paymentStatus: 'paid',
          totalAmount: { $gte: 0 },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          enrollments: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top courses by revenue
    const topCourses = await Order.aggregate([
      {
        $unwind: '$courses'
      },
      {
        $match: {
          'courses.course': { $in: courseIds },
          status: 'completed',
          paymentStatus: 'paid',
          totalAmount: { $gte: 0 },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$courses.course',
          revenue: { $sum: '$courses.price' },
          enrollments: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      }
    ]);

    // Get student engagement metrics
    const totalEnrollments = await Order.countDocuments({
      'courses.course': { $in: courseIds },
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: { $gte: 0 }
    });

    const activeStudents = await Progress.distinct('user', {
      course: { $in: courseIds },
      lastAccessedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const completedCourses = await Progress.countDocuments({
      course: { $in: courseIds },
      progressPercentage: 100
    });

    const avgProgress = await Progress.aggregate([
      {
        $match: { course: { $in: courseIds } }
      },
      {
        $group: {
          _id: null,
          averageProgress: { $avg: '$progressPercentage' }
        }
      }
    ]);

    const studentEngagement = {
      totalStudents: totalEnrollments,
      activeStudents: activeStudents.length,
      completionRate: totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0,
      averageProgress: avgProgress[0]?.averageProgress || 0
    };

    // Get recent enrollments
    const recentEnrollments = await Order.find({
      'courses.course': { $in: courseIds },
      status: 'completed'
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate total revenue (all-time) for comparison
    const allTimeRevenue = await Order.aggregate([
      {
        $match: {
          'courses.course': { $in: courseIds },
          status: 'completed',
          paymentStatus: 'paid',
          totalAmount: { $gte: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const totalRevenueAllTime = allTimeRevenue[0]?.totalRevenue || 0;
    const totalOrdersAllTime = allTimeRevenue[0]?.totalOrders || 0;

    const analytics = {
      revenueData: revenueData.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        enrollments: item.enrollments
      })),
      topCourses,
      studentEngagement,
      totalRevenue: totalRevenueAllTime, // Add all-time total revenue
      totalOrders: totalOrdersAllTime,   // Add all-time total orders
      period: period, // Add period info for frontend
      recentEnrollments: recentEnrollments.map(enrollment => {
        // Find the course from the enrollment that matches our instructor's courses
        const enrolledCourse = enrollment.courses.find((c: any) =>
          courseIds.some(courseId => courseId.toString() === c.course.toString())
        );

        return {
          _id: enrollment._id,
          student: enrollment.user,
          course: {
            _id: enrolledCourse?.course || null,
            title: enrolledCourse?.title || 'Unknown Course'
          },
          enrolledAt: enrollment.createdAt
        };
      })
    };

    sendSuccess(res, 'Analytics retrieved successfully', analytics);
  } catch (error: any) {
    console.error('Get instructor analytics error:', error);
    sendError(res, 'Failed to retrieve analytics', 500);
  }
});

/**
 * @swagger
 * /instructor/students:
 *   post:
 *     summary: Add student to course
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student added successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Student or course not found
 */
router.post('/students', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const { email, courseId } = req.body;

    if (!email || !courseId) {
      return sendError(res, 'Email and course ID are required', 400);
    }

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    // Find student by email
    const student = await User.findOne({ email: email.toLowerCase() });
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Check if student is already enrolled (check latest enrollment status)
    // Use updatedAt instead of createdAt to get the most recently modified enrollment
    const latestEnrollment = await Order.findOne({
      user: student._id,
      'courses.course': courseId,
      $or: [
        { paymentStatus: 'paid' },
        { paymentMethod: 'instructor_enrollment' }
      ]
    }).sort({ updatedAt: -1, createdAt: -1 }); // Get the most recently updated enrollment

    // If latest enrollment exists and is completed, student is already enrolled
    if (latestEnrollment && latestEnrollment.status === 'completed') {
      return sendError(res, 'Student is already enrolled in this course', 400);
    }

    // If latest enrollment is cancelled, we can reactivate it or create new one
    if (latestEnrollment && latestEnrollment.status === 'cancelled') {
      // First, ensure no other active enrollments exist for this course
      await Order.updateMany(
        {
          user: student._id,
          'courses.course': courseId,
          status: 'completed',
          _id: { $ne: latestEnrollment._id }
        },
        { status: 'cancelled', cancelReason: 'Replaced by new enrollment' },
        { runValidators: false }
      );

      // Reactivate the cancelled enrollment
      await Order.findByIdAndUpdate(latestEnrollment._id, {
        status: 'completed',
        cancelledAt: null,
        cancelReason: null
      }, { runValidators: false });

      // Recreate progress record
      await Progress.findOneAndUpdate(
        { user: student._id, course: courseId },
        {
          user: student._id,
          course: courseId,
          progressPercentage: 0,
          completedLessons: [],
          lastAccessedAt: new Date(),
          status: 'not_started'
        },
        { upsert: true }
      );

      // Update course enrolled students count
      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrolledStudents: 1 }
      });

      return sendSuccess(res, 'Student re-enrolled in course successfully', {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar
        },
        course: {
          _id: course._id,
          title: course.title
        },
        enrolledAt: latestEnrollment.createdAt,
        reactivated: true
      }, 201);
    }

    // Create new enrollment order (no existing enrollment or latest was not cancelled)
    // First, ensure no other active enrollments exist for this course
    await Order.updateMany(
      {
        user: student._id,
        'courses.course': courseId,
        status: 'completed'
      },
      { status: 'cancelled', cancelReason: 'Replaced by new enrollment' },
      { runValidators: false }
    );
    const order = new Order({
      user: student._id,
      courses: [{
        course: courseId,
        title: course.title,
        price: 0, // Free enrollment by instructor
        instructor: instructorId
      }],
      totalAmount: 0,
      status: 'completed',
      paymentMethod: 'instructor_enrollment'
    });

    await order.save();

    // Create initial progress record
    const progress = new Progress({
      user: student._id,
      course: courseId,
      progressPercentage: 0,
      completedLessons: [],
      lastAccessedAt: new Date()
    });

    await progress.save();

    // Update course enrolled students count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledStudents: 1 }
    });

    return sendSuccess(res, 'Student added to course successfully', {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar
      },
      course: {
        _id: course._id,
        title: course.title
      },
      enrolledAt: order.createdAt
    }, 201);
  } catch (error: any) {
    console.error('Add student error:', error);
    return sendError(res, 'Failed to add student to course', 500);
  }
});

/**
 * @swagger
 * /instructor/students/{id}:
 *   put:
 *     summary: Update student enrollment
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student enrollment updated successfully
 *       404:
 *         description: Student enrollment not found
 */
router.put('/students/:id', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const enrollmentId = req.params.id;
    const { progress: newProgress, notes } = req.body;

    // Find the enrollment order
    const enrollment = await Order.findById(enrollmentId)
      .populate('user', 'name email avatar');

    if (!enrollment) {
      return sendError(res, 'Student enrollment not found', 404);
    }

    // Verify instructor owns the course
    const courseId = enrollment.courses[0]?.course;
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    // Update progress if provided
    if (newProgress !== undefined) {
      await Progress.findOneAndUpdate(
        { user: enrollment.user, course: courseId },
        {
          progressPercentage: Math.max(0, Math.min(100, newProgress)),
          lastAccessedAt: new Date()
        },
        { upsert: true }
      );
    }

    // Update enrollment notes if provided
    if (notes !== undefined) {
      await Order.findByIdAndUpdate(enrollmentId, { notes }, { runValidators: false });
    }

    return sendSuccess(res, 'Student enrollment updated successfully', {
      _id: enrollment._id,
      student: enrollment.user,
      progress: newProgress,
      notes: notes
    });
  } catch (error: any) {
    console.error('Update student enrollment error:', error);
    return sendError(res, 'Failed to update student enrollment', 500);
  }
});

/**
 * @swagger
 * /instructor/students/{id}:
 *   delete:
 *     summary: Remove student from course
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student removed successfully
 *       404:
 *         description: Student enrollment not found
 */
router.delete('/students/:id', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const enrollmentId = req.params.id;

    // Find the enrollment order
    const enrollment = await Order.findById(enrollmentId);
    if (!enrollment) {
      return sendError(res, 'Student enrollment not found', 404);
    }

    // Verify instructor owns the course
    const courseId = enrollment.courses[0]?.course;
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    // Remove progress record
    await Progress.findOneAndDelete({
      user: enrollment.user,
      course: courseId
    });

    // Update enrollment status to cancelled and fix negative totalAmount
    const order = await Order.findById(enrollmentId);
    await Order.findByIdAndUpdate(enrollmentId, {
      status: 'cancelled',
      totalAmount: order && order.totalAmount < 0 ? Math.abs(order.totalAmount) : order?.totalAmount
    }, { runValidators: false });

    // Update course enrolled students count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledStudents: -1 }
    });

    return sendSuccess(res, 'Student removed from course successfully');
  } catch (error: any) {
    console.error('Remove student error:', error);
    return sendError(res, 'Failed to remove student from course', 500);
  }
});

/**
 * @swagger
 * /instructor/students/export:
 *   get:
 *     summary: Export students data
 *     tags: [Instructor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for student name or email
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *           default: csv
 *         description: Export format
 *     responses:
 *       200:
 *         description: Students data exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No students found
 */
router.get('/students/export', async (req: AuthRequest, res) => {
  try {
    const instructorId = req.user!._id;
    const { courseId, search, format = 'csv' } = req.query;

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          status: 'completed',
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $match: {
          'courseDetails.instructor': instructorId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $lookup: {
          from: 'progresses',
          let: { userId: '$user', courseId: '$courses.course' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $in: ['$course', '$$courseId'] }
                  ]
                }
              }
            }
          ],
          as: 'progressDetails'
        }
      },
      {
        $unwind: '$studentDetails'
      },
      {
        $unwind: '$courseDetails'
      },
      {
        $unwind: {
          path: '$courses',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add course filter if specified
    if (courseId && courseId !== '') {
      pipeline.push({
        $match: {
          'courseDetails._id': new mongoose.Types.ObjectId(courseId as string)
        }
      });
    }

    // Add search filter if specified
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'studentDetails.name': { $regex: search, $options: 'i' } },
            { 'studentDetails.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Project final fields
    pipeline.push({
      $project: {
        studentName: '$studentDetails.name',
        studentEmail: '$studentDetails.email',
        courseTitle: '$courseDetails.title',
        progress: {
          $ifNull: [
            { $arrayElemAt: ['$progressDetails.progressPercentage', 0] },
            0
          ]
        },
        enrolledAt: '$createdAt',
        lastAccessedAt: {
          $ifNull: [
            { $arrayElemAt: ['$progressDetails.lastAccessedAt', 0] },
            null
          ]
        },
        status: {
          $cond: {
            if: { $gte: [{ $ifNull: [{ $arrayElemAt: ['$progressDetails.progressPercentage', 0] }, 0] }, 100] },
            then: 'Completed',
            else: {
              $cond: {
                if: { $gt: [{ $ifNull: [{ $arrayElemAt: ['$progressDetails.progressPercentage', 0] }, 0] }, 0] },
                then: 'In Progress',
                else: 'Not Started'
              }
            }
          }
        }
      }
    });

    // Sort by student name
    pipeline.push({
      $sort: { studentName: 1 }
    });

    const students = await Order.aggregate(pipeline);

    if (students.length === 0) {
      return sendError(res, 'No students found', 404);
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Student Name',
        'Email',
        'Course',
        'Progress (%)',
        'Enrolled Date',
        'Last Activity',
        'Status'
      ];

      const csvRows = students.map(student => [
        student.studentName,
        student.studentEmail,
        student.courseTitle,
        student.progress.toString(),
        new Date(student.enrolledAt).toLocaleDateString(),
        student.lastAccessedAt ? new Date(student.lastAccessedAt).toLocaleDateString() : 'Never',
        student.status
      ]);

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students-export.csv"');
      return res.send(csvContent);
    } else {
      // Generate Excel file
      const headers = [
        'Student Name',
        'Email',
        'Course',
        'Progress (%)',
        'Enrolled Date',
        'Last Activity',
        'Status'
      ];

      const excelRows = students.map(student => [
        student.studentName,
        student.studentEmail,
        student.courseTitle,
        student.progress,
        new Date(student.enrolledAt).toLocaleDateString(),
        student.lastAccessedAt ? new Date(student.lastAccessedAt).toLocaleDateString() : 'Never',
        student.status
      ]);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelRows]);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Student Name
        { wch: 25 }, // Email
        { wch: 30 }, // Course
        { wch: 12 }, // Progress
        { wch: 15 }, // Enrolled Date
        { wch: 15 }, // Last Activity
        { wch: 15 }  // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="students-export.xlsx"');
      return res.send(excelBuffer);
    }

  } catch (error: any) {
    console.error('Export students error:', error);
    return sendError(res, 'Failed to export students data', 500);
  }
});

// Mount lesson routes
router.use('/', lessonRoutes);

// Mount instructor submissions routes
router.use('/courses', instructorSubmissionsRouter);

export default router;
