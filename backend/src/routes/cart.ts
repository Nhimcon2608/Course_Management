import express from 'express';
import { AuthRequest } from '@/types';
import { authenticate, requireEmailVerification } from '@/middleware/auth';
import Cart from '@/models/Cart';
import Course from '@/models/Course';

const router = express.Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOrCreateForUser(userId);
    await cart.populate({
      path: 'items.course',
      select: 'title slug price originalPrice thumbnail instructor category level duration rating totalRatings',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name slug' }
      ]
    });

    res.json({
      success: true,
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add course to cart
 *     tags: [Cart]
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
 *         description: Course added to cart successfully
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

    // Get or create cart
    const cart = await Cart.findOrCreateForUser(userId);

    // Check if course already in cart
    if (cart.hasCourse(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Course is already in cart'
      });
      return;
    }

    // Add course to cart
    await cart.addCourse(courseId, course.price, course.originalPrice);

    // Populate cart for response
    await cart.populate({
      path: 'items.course',
      select: 'title slug price originalPrice thumbnail instructor category',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    });

    res.json({
      success: true,
      message: 'Course added to cart successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to cart'
    });
  }
});

/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Remove course from cart
 *     tags: [Cart]
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
 *         description: Course removed from cart successfully
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

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
      return;
    }

    // Remove course from cart
    await cart.removeCourse(courseId);

    // Populate cart for response
    await cart.populate({
      path: 'items.course',
      select: 'title slug price originalPrice thumbnail instructor category',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    });

    res.json({
      success: true,
      message: 'Course removed from cart successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from cart'
    });
  }
});

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/clear', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
      return;
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
});

/**
 * @swagger
 * /cart/apply-coupon:
 *   post:
 *     summary: Apply coupon to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *               discountAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
router.post('/apply-coupon', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { couponCode } = req.body;

    if (!couponCode) {
      res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
      return;
    }

    if (cart.totalAmount === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot apply coupon to empty cart'
      });
      return;
    }

    // Import Coupon model
    const Coupon = (await import('@/models/Coupon')).default;

    // Find and validate coupon
    const coupon = await (Coupon as any).findValidCoupon(couponCode);

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
      return;
    }

    // Check minimum order amount
    if (cart.totalAmount < coupon.minOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of ${coupon.minOrderAmount.toLocaleString('vi-VN')} VND required for this coupon`
      });
      return;
    }

    // Check applicable courses if specified
    if (coupon.applicableCourses.length > 0) {
      const cartCourseIds = cart.items.map((item: any) => item.course.toString());
      const applicableCourseIds = coupon.applicableCourses.map((id: any) => id.toString());
      const hasApplicableCourse = cartCourseIds.some(courseId =>
        applicableCourseIds.includes(courseId)
      );

      if (!hasApplicableCourse) {
        res.status(400).json({
          success: false,
          message: 'This coupon is not applicable to the courses in your cart'
        });
        return;
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cart.totalAmount);

    // Apply coupon to cart
    cart.couponCode = coupon.code;
    cart.couponId = coupon._id;
    cart.discountAmount = discountAmount;
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.course',
      select: 'title slug price originalPrice thumbnail instructor category',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    });

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply coupon'
    });
  }
});

/**
 * @swagger
 * /cart/remove-coupon:
 *   delete:
 *     summary: Remove coupon from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 */
router.delete('/remove-coupon', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
      return;
    }

    await cart.removeCoupon();

    res.json({
      success: true,
      message: 'Coupon removed successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove coupon'
    });
  }
});

export default router;
