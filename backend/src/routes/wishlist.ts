import express from 'express';
import { authenticate, requireEmailVerification } from '@/middleware/auth';
import User from '@/models/User';
import Course from '@/models/Course';
import Wishlist from '@/models/Wishlist';
import { AuthRequest } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const wishlist = await Wishlist.findOrCreateForUser(userId);

    res.json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: {
        wishlist: wishlist.courses || [],
        count: wishlist.getCourseCount() || 0
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
});

/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add course to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course added to wishlist successfully
 */
router.post('/add', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId } = req.body;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
      return;
    }

    // Check if course exists and is published
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Get or create wishlist
    const wishlist = await Wishlist.findOrCreateForUser(userId);

    // Check if course is already in wishlist
    if (wishlist.hasCourse(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Course is already in wishlist'
      });
      return;
    }

    // Add course to wishlist
    await wishlist.addCourse(courseId);

    // Refresh wishlist with populated data
    const updatedWishlist = await Wishlist.findOrCreateForUser(userId);

    res.json({
      success: true,
      message: 'Course added to wishlist successfully',
      data: {
        wishlist: updatedWishlist.courses,
        count: updatedWishlist.getCourseCount()
      }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to wishlist'
    });
  }
});

/**
 * @swagger
 * /wishlist/remove:
 *   delete:
 *     summary: Remove course from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course removed from wishlist successfully
 */
router.delete('/remove', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId } = req.body;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
      return;
    }

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
      return;
    }

    // Remove course from wishlist
    await wishlist.removeCourse(courseId);

    // Refresh wishlist with populated data
    const updatedWishlist = await Wishlist.findOrCreateForUser(userId);

    res.json({
      success: true,
      message: 'Course removed from wishlist successfully',
      data: {
        wishlist: updatedWishlist.courses || [],
        count: updatedWishlist.getCourseCount() || 0
      }
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from wishlist'
    });
  }
});

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear all items from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 */
router.delete('/clear', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
      return;
    }

    // Clear all courses
    wishlist.courses = [];
    await wishlist.save();

    res.json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        wishlist: [],
        count: 0
      }
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist'
    });
  }
});

/**
 * @swagger
 * /wishlist/move-to-cart:
 *   post:
 *     summary: Move course from wishlist to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course moved to cart successfully
 */
router.post('/move-to-cart', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId } = req.body;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
      return;
    }

    // Check if course exists (handle both ObjectId and slug)
    const course = await Course.findOne({
      $or: [{ _id: courseId }, { slug: courseId }],
      isPublished: true,
      status: 'published'
    });
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
      return;
    }

    // Check if course is in wishlist
    if (!wishlist.hasCourse(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Course is not in wishlist'
      });
      return;
    }

    // Add to cart
    const Cart = (await import('@/models/Cart')).default;
    const cart = await Cart.findOrCreateForUser(userId);

    // Check if course already in cart
    if (cart.hasCourse(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Course is already in cart'
      });
      return;
    }

    await cart.addCourse(courseId, course.price, course.originalPrice);

    // Remove from wishlist
    await wishlist.removeCourse(courseId);

    // Refresh wishlist with populated data
    const updatedWishlist = await Wishlist.findOrCreateForUser(userId);

    res.json({
      success: true,
      message: 'Course moved to cart successfully',
      data: {
        wishlist: updatedWishlist.courses || [],
        count: updatedWishlist.getCourseCount() || 0
      }
    });
  } catch (error) {
    console.error('Error moving to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move course to cart'
    });
  }
});

export default router;
