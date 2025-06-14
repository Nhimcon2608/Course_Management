import express from 'express';
import { authenticate, requireEmailVerification } from '@/middleware/auth';
import Review from '@/models/Review';
import Course from '@/models/Course';
import Order from '@/models/Order';
import { AuthRequest } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get reviews with pagination
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, rating } = req.query;

    const filter: any = {};
    if (courseId) {
      // Handle both ObjectId and slug for courseId
      try {
        // Try to find course by ObjectId or slug
        const course = await Course.findOne({
          $or: [{ _id: courseId }, { slug: courseId }]
        }).select('_id');

        if (course) {
          filter.course = course._id;
        } else {
          // If course not found, set impossible filter to return empty results
          filter.course = null;
        }
      } catch (error) {
        // If courseId is not a valid ObjectId, try to find by slug
        const course = await Course.findOne({ slug: courseId }).select('_id');
        if (course) {
          filter.course = course._id;
        } else {
          filter.course = null;
        }
      }
    }
    if (rating) filter.rating = Number(rating);

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name avatar')
        .populate('course', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: 'Reviews retrieved successfully',
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
      message: 'Failed to fetch reviews'
    });
  }
});

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - rating
 *             properties:
 *               courseId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId, rating, title, comment } = req.body;

    if (!courseId || !rating) {
      res.status(400).json({
        success: false,
        message: 'Course ID and rating are required'
      });
      return;
    }

    // Check if course exists (support both ObjectId and slug)
    const course = await Course.findOne({
      $or: [{ _id: courseId }, { slug: courseId }]
    });
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Use the actual course ObjectId for subsequent operations
    const actualCourseId = course._id;

    // Check if user has already reviewed this course
    const existingReview = await Review.findOne({
      user: userId,
      course: actualCourseId
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
      return;
    }

    // Check if user has purchased the course
    const order = await Order.findOne({
      user: userId,
      'courses.course': actualCourseId,
      status: 'completed'
    });

    const isVerifiedPurchase = !!order;

    // Create review
    const review = new Review({
      user: userId,
      course: actualCourseId,
      rating: Number(rating),
      title: title?.trim(),
      comment: comment?.trim(),
      isVerifiedPurchase
    });

    await review.save();

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'name avatar' },
      { path: 'course', select: 'title slug' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check if user owns the review
    if (review.user.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
      return;
    }

    // Store original review data if this is the first edit
    if (!review.isEdited) {
      review.originalReview = {
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        editedAt: new Date()
      };
    }

    // Update review
    if (rating !== undefined) review.rating = Number(rating);
    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();
    
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'name avatar' },
      { path: 'course', select: 'title slug' }
    ]);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== userId.toString() && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
      return;
    }

    await Review.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

export default router;
