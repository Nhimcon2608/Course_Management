import express from 'express';
import { authenticate } from '@/middleware/auth';
import { sendSuccess, sendError } from '@/utils/response';
import User from '@/models/User';
import Progress from '@/models/Progress';
import Order from '@/models/Order';
import Course from '@/models/Course';
import { AuthRequest } from '@/types';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: User dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get user dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get user learning statistics from Progress model
    const learningStats = await Progress.getUserStats(userId);

    // Get user orders statistics
    const orderStats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const orderData = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0
    };

    // Calculate learning hours from minutes
    const learningHours = Math.round(learningStats.totalWatchTime / 60);

    const stats = {
      enrolledCourses: learningStats.totalCourses,
      completedCourses: learningStats.completedCourses,
      inProgressCourses: learningStats.inProgressCourses,
      learningHours: learningHours,
      certificates: learningStats.certificatesEarned,
      totalSpent: orderData.totalSpent,
      averageProgress: Math.round(learningStats.averageProgress || 0)
    };

    sendSuccess(res, 'Dashboard statistics retrieved successfully', { stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    sendError(res, 'Failed to retrieve dashboard statistics', 500);
  }
});

/**
 * @swagger
 * /dashboard/enrolled-courses:
 *   get:
 *     summary: Get user's enrolled courses with progress
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Enrolled courses retrieved successfully
 */
router.get('/enrolled-courses', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user's enrolled courses from latest enrollments (not cancelled)
    const enrolledCourses = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      // Group by course to get latest enrollment for each course
      { $unwind: '$courses' },
      {
        $sort: { createdAt: -1 } // Sort by creation date descending
      },
      {
        $group: {
          _id: '$courses.course',
          latestOrder: { $first: '$$ROOT' }
        }
      },
      {
        $match: {
          'latestOrder.status': 'completed' // Only include if latest enrollment is completed
        }
      },
      {
        $replaceRoot: { newRoot: '$latestOrder' }
      },
      { $unwind: '$courses' },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'progresses',
          let: { courseId: '$courses.course', userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$user', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'progress'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'courseDetails.instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $project: {
          _id: '$courseDetails._id',
          title: '$courseDetails.title',
          slug: '$courseDetails.slug',
          thumbnail: '$courseDetails.thumbnail',
          instructor: { $arrayElemAt: ['$instructor.name', 0] },
          level: '$courseDetails.level',
          duration: '$courseDetails.duration',
          totalLessons: { $size: '$courseDetails.lessons' },
          enrolledAt: '$createdAt',
          progress: {
            $cond: {
              if: { $gt: [{ $size: '$progress' }, 0] },
              then: { $arrayElemAt: ['$progress', 0] },
              else: {
                progressPercentage: 0,
                status: 'not_started',
                lastAccessedAt: '$createdAt',
                completedLessons: [],
                totalWatchTime: 0
              }
            }
          }
        }
      },
      { $sort: { 'progress.lastAccessedAt': -1 } },
      { $limit: limit }
    ]);

    sendSuccess(res, 'Enrolled courses retrieved successfully', { courses: enrolledCourses });
  } catch (error) {
    console.error('Enrolled courses error:', error);
    sendError(res, 'Failed to retrieve enrolled courses', 500);
  }
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get user's recent learning activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/recent-activity', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent progress updates
    const recentActivity = await Progress.find({ user: userId })
      .populate({
        path: 'course',
        select: 'title slug thumbnail instructor',
        populate: {
          path: 'instructor',
          select: 'name'
        }
      })
      .sort({ lastAccessedAt: -1 })
      .limit(limit)
      .lean();

    const activities = recentActivity.map(progress => ({
      type: 'course_access',
      course: progress.course,
      progressPercentage: progress.progressPercentage,
      lastAccessedAt: progress.lastAccessedAt,
      status: progress.status,
      completedLessons: progress.completedLessons.length,
      totalLessons: (progress.course as any)?.lessons?.length || 0
    }));

    sendSuccess(res, 'Recent activity retrieved successfully', { activities });
  } catch (error) {
    console.error('Recent activity error:', error);
    sendError(res, 'Failed to retrieve recent activity', 500);
  }
});

/**
 * @swagger
 * /dashboard/recommendations:
 *   get:
 *     summary: Get course recommendations for user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Course recommendations retrieved successfully
 */
router.get('/recommendations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const limit = parseInt(req.query.limit as string) || 6;

    // Get user's enrolled course categories (not cancelled)
    const userCategories = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed', // Only completed orders (cancelled orders have different status)
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      { $unwind: '$courses' },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $group: {
          _id: '$courseDetails.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const categoryIds = userCategories.map(cat => cat._id);

    // Get user's enrolled course IDs to exclude from recommendations (not cancelled)
    const enrolledCourseIds = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed', // Only completed orders (cancelled orders have different status)
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      { $unwind: '$courses' },
      { $group: { _id: null, courseIds: { $addToSet: '$courses.course' } } }
    ]);

    const excludeCourseIds = enrolledCourseIds[0]?.courseIds || [];

    // Get recommended courses
    let recommendedCourses;
    
    if (categoryIds.length > 0) {
      // Recommend courses from user's preferred categories
      recommendedCourses = await Course.find({
        _id: { $nin: excludeCourseIds },
        category: { $in: categoryIds },
        isPublished: true,
        status: 'published'
      })
      .populate('instructor', 'name')
      .populate('category', 'name slug')
      .sort({ rating: -1, enrolledStudents: -1 })
      .limit(limit)
      .lean();
    } else {
      // Recommend popular courses if user has no enrollment history
      recommendedCourses = await Course.find({
        isPublished: true,
        status: 'published'
      })
      .populate('instructor', 'name')
      .populate('category', 'name slug')
      .sort({ rating: -1, enrolledStudents: -1 })
      .limit(limit)
      .lean();
    }

    sendSuccess(res, 'Course recommendations retrieved successfully', { courses: recommendedCourses });
  } catch (error) {
    console.error('Recommendations error:', error);
    sendError(res, 'Failed to retrieve course recommendations', 500);
  }
});

export default router;
