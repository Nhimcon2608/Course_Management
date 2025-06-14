import express from 'express';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Category from '@/models/Category';
import Progress from '@/models/Progress';
import Order from '@/models/Order';
import Lesson from '@/models/Lesson';
import Assignment from '@/models/Assignment';
import assignmentSubmissionsRouter from './assignmentSubmissions';
import { auth, requireCourseEnrollment, requireEmailVerification } from '@/middleware/auth';
import { AuthRequest, ILearningStats } from '@/types';

const router = express.Router();

// Mount assignment submissions routes
router.use('/assignments', assignmentSubmissionsRouter);

// GET /api/learning/progress - Get user's learning progress
router.get('/progress', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { status, courseId, limit = 10, offset = 0 } = req.query;

    // Build filter
    const filter: any = { user: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (courseId) {
      filter.course = courseId;
    }

    // Get progress with pagination
    const progress = await Progress.find(filter)
      .populate('course', 'title slug thumbnail price originalPrice rating studentsCount duration level category instructor')
      .sort({ lastAccessedAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    const total = await Progress.countDocuments(filter);

    res.json({
      success: true,
      message: 'Learning progress retrieved successfully',
      data: {
        progress,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      }
    });
  } catch (error) {
    console.error('Get learning progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/progress - Get learning progress for a course
router.get('/progress', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find progress record
    const progress = await Progress.findOne({
      user: userId,
      course: courseId
    }).lean();

    if (!progress) {
      return res.json({
        success: true,
        message: 'No progress found for this course',
        data: {
          progressPercentage: 0,
          status: 'not_started',
          completedLessons: [],
          totalWatchTime: 0,
          lastAccessedAt: null,
          currentLesson: null
        }
      });
    }

    return res.json({
      success: true,
      message: 'Progress retrieved successfully',
      data: progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/courses/:courseId/lessons - Get lessons for enrolled students
router.get('/courses/:courseId/lessons', auth, requireEmailVerification, requireCourseEnrollment, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    // Enrollment is already verified by requireCourseEnrollment middleware

    // Get published lessons for the course
    const lessons = await Lesson.find({
      course: courseId,
      isPublished: true
    })
      .select('title description content videoUrl videoThumbnail videoDuration videoSize videoFormat order duration isPreview resources')
      .sort({ order: 1 })
      .lean();

    return res.json({
      success: true,
      message: 'Lessons retrieved successfully',
      data: {
        lessons,
        total: lessons.length
      }
    });
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course lessons',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/learning/courses/:courseId/assignments - Get assignments for enrolled students
router.get('/courses/:courseId/assignments', auth, requireEmailVerification, requireCourseEnrollment, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    // Enrollment is already verified by requireCourseEnrollment middleware

    // Get published assignments for the course
    const assignments = await Assignment.find({
      course: courseId,
      isPublished: true
    })
      .populate('lesson', 'title order')
      .select('title description instructions questions totalPoints passingScore timeLimit attempts deadline lesson')
      .sort({ 'lesson.order': 1 })
      .lean();

    return res.json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: {
        assignments,
        total: assignments.length
      }
    });
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course assignments',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/learning/progress - Update learning progress
router.post('/progress', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId, lessonId, completed, watchTime } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Lesson ID are required'
      });
    }

    // Check if user has valid enrollment
    const enrollment = await Order.findOne({
      user: userId,
      'courses.course': courseId,
      status: { $in: ['completed'] },
      $or: [
        { paymentStatus: 'paid' },
        { paymentMethod: 'instructor_enrollment' }
      ]
    });

    if (!enrollment || enrollment.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course or your enrollment has been cancelled'
      });
    }

    // Find or create progress record
    let progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      progress = new Progress({
        user: userId,
        course: courseId,
        progressPercentage: 0,
        status: 'not_started',
        completedLessons: [],
        totalWatchTime: 0,
        lastAccessedAt: new Date()
      });
    }

    // Update progress
    progress.lastAccessedAt = new Date();
    progress.currentLesson = lessonId;

    if (watchTime) {
      progress.totalWatchTime += watchTime;
    }

    if (completed && !progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }

    // Get total lessons count from separate lessons collection
    const totalLessons = await Lesson.countDocuments({
      course: courseId,
      isPublished: true
    });

    if (totalLessons > 0) {
      const completedCount = progress.completedLessons.length;
      progress.progressPercentage = Math.round((completedCount / totalLessons) * 100);

      // Update status based on progress
      if (progress.progressPercentage === 0) {
        progress.status = 'not_started';
      } else if (progress.progressPercentage === 100) {
        progress.status = 'completed';
      } else {
        progress.status = 'in_progress';
      }
    }

    await progress.save();

    return res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/courses - Get enrolled courses with progress
router.get('/courses', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { status, category, search, limit = 12, offset = 0 } = req.query;

    // Get enrolled courses from latest enrollments (not cancelled)
    const latestEnrollments = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      { $unwind: '$courses' },
      { $sort: { createdAt: -1 } },
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
        $project: {
          courses: ['$latestOrder.courses']
        }
      }
    ]);

    const enrolledCourseIds = latestEnrollments.flatMap((enrollment: any) =>
      enrollment.courses.map((item: any) => item.course.toString())
    );

    if (enrolledCourseIds.length === 0) {
      return res.json({
        success: true,
        message: 'No enrolled courses found',
        data: {
          courses: [],
          pagination: {
            total: 0,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: false
          }
        }
      });
    }

    // Get courses with basic info
    const courses = await Course.find({
      _id: { $in: enrolledCourseIds },
      isPublished: true,
      status: 'published'
    })
      .populate('category', 'name slug')
      .populate('instructor', 'name avatar')
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const progress = await Progress.findOne({
          user: userId,
          course: course._id
        }).lean();

        return {
          ...course,
          progress: progress || {
            progressPercentage: 0,
            status: 'not_started',
            totalWatchTime: 0,
            completedLessons: [],
            lastAccessedAt: null
          }
        };
      })
    );

    return res.json({
      success: true,
      message: 'Enrolled courses retrieved successfully',
      data: {
        courses: coursesWithProgress,
        pagination: {
          total: courses.length,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < courses.length
        }
      }
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/statistics - Get learning statistics
router.get('/statistics', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get enrolled courses count (not cancelled)
    const latestEnrollments = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'instructor_enrollment' }
          ]
        }
      },
      { $unwind: '$courses' },
      { $sort: { createdAt: -1 } },
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
        $project: {
          courses: ['$latestOrder.courses']
        }
      }
    ]);

    const enrolledCourseIds = latestEnrollments.flatMap((enrollment: any) =>
      enrollment.courses.map((item: any) => item.course.toString())
    );

    // Get progress statistics
    const progressStats = await Progress.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalWatchTime: { $sum: '$totalWatchTime' },
          avgProgress: { $avg: '$progressPercentage' }
        }
      }
    ]);

    // Calculate statistics
    const stats: ILearningStats = {
      totalCoursesEnrolled: enrolledCourseIds.length,
      totalCoursesCompleted: progressStats.find(s => s._id === 'completed')?.count || 0,
      totalHoursLearned: Math.round(progressStats.reduce((sum, s) => sum + (s.totalWatchTime || 0), 0) / 3600),
      currentStreak: 0,
      longestStreak: 0,
      averageProgress: Math.round(progressStats.reduce((sum, s) => sum + (s.avgProgress || 0), 0) / Math.max(progressStats.length, 1)),
      certificatesEarned: 0,
      achievementsUnlocked: 0,
      lastActivityDate: new Date(),
      weeklyGoal: 10,
      weeklyProgress: 0
    };

    return res.json({
      success: true,
      message: 'Learning statistics retrieved successfully',
      data: {
        stats,
        progressBreakdown: progressStats
      }
    });
  } catch (error) {
    console.error('Get learning statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/achievements - Get user achievements (simplified)
router.get('/achievements', auth, async (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      message: 'Achievements retrieved successfully',
      data: {
        achievements: [],
        stats: [],
        pagination: {
          limit: 20,
          offset: 0,
          total: 0
        }
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve achievements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/activities - Get learning activities (simplified)
router.get('/activities', auth, async (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      message: 'Learning activities retrieved successfully',
      data: {
        activities: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      }
    });
  } catch (error) {
    console.error('Get learning activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/certificates - Get user certificates (simplified)
router.get('/certificates', auth, async (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: {
        certificates: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/learning/recommendations - Get learning recommendations (simplified)
router.get('/recommendations', auth, async (req: AuthRequest, res) => {
  try {
    const { limit = 6 } = req.query;

    // Get some popular courses as recommendations
    const recommendations = await Course.find({
      isPublished: true,
      status: 'published',
      rating: { $gte: 4.0 }
    })
      .populate('category', 'name slug')
      .populate('instructor', 'name avatar')
      .sort({ rating: -1, studentsCount: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      message: 'Learning recommendations retrieved successfully',
      data: {
        recommendations,
        userProfile: {
          level: 'beginner',
          interestedCategories: [],
          enrolledCoursesCount: 0,
          completedCoursesCount: 0
        }
      }
    });
  } catch (error) {
    console.error('Get learning recommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
