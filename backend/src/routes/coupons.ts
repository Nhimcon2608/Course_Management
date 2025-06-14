import express from 'express';
import { AuthRequest } from '@/types';
import { authenticate, authorize } from '@/middleware/auth';
import Coupon from '@/models/Coupon';

const router = express.Router();

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon validation result
 */
router.post('/validate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { code, orderAmount, courseIds } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
      return;
    }

    if (!orderAmount || orderAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order amount is required'
      });
      return;
    }

    // Find coupon
    const coupon = await (Coupon as any).findValidCoupon(code);
    
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
      return;
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of ${coupon.minOrderAmount.toLocaleString('vi-VN')} VND required for this coupon`
      });
      return;
    }

    // Check applicable courses if specified
    if (coupon.applicableCourses.length > 0 && courseIds && courseIds.length > 0) {
      const applicableCourseIds = coupon.applicableCourses.map((id: any) => id.toString());
      const hasApplicableCourse = courseIds.some((courseId: string) =>
        applicableCourseIds.includes(courseId.toString())
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
    const discountAmount = coupon.calculateDiscount(orderAmount);

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
          minOrderAmount: coupon.minOrderAmount
        },
        discountAmount,
        finalAmount: orderAmount - discountAmount,
        remainingUsage: coupon.remainingUsage
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
});

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .populate('applicableCourses', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Coupon.countDocuments(filter);

    res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons'
    });
  }
});

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validTo:
 *                 type: string
 *                 format: date
 *               usageLimit:
 *                 type: number
 *               applicableCourses:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user!._id
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    await coupon.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'applicableCourses', select: 'title slug' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon }
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
      return;
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create coupon'
    });
  }
});

export default router;
