import express from 'express';
import { AuthRequest } from '@/types';
import { authenticate, requireEmailVerification } from '@/middleware/auth';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
import User from '@/models/User';
import { zaloPayService } from '@/services/zaloPayService';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('courses.course', 'title slug thumbnail')
      .populate('couponId', 'code discountType discountValue')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('courses.course', 'title slug thumbnail instructor category')
      .populate('couponId', 'code discountType discountValue')
      .populate('user', 'name email');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [zalopay, cash, bank_transfer]
 *               billingAddress:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { paymentMethod = 'zalopay', billingAddress, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.course',
      select: 'title slug price originalPrice thumbnail instructor',
      populate: { path: 'instructor', select: 'name' }
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Validate coupon if applied
    let coupon = null;
    if (cart.couponId) {
      coupon = await Coupon.findById(cart.couponId);
      if (!coupon || !coupon.canBeUsed()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon'
        });
        return;
      }
    }

    // Generate order number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Create order
    const orderData = {
      orderNumber,
      user: userId,
      courses: cart.items.map((item: any) => ({
        course: item.course._id,
        title: item.course.title,
        price: item.price,
        originalPrice: item.originalPrice,
        discountAmount: item.discountAmount || 0,
        instructor: item.course.instructor?.name || 'Unknown',
        thumbnail: item.course.thumbnail
      })),
      subtotal: cart.totalAmount,
      discountAmount: cart.discountAmount,
      totalAmount: cart.totalAmount - cart.discountAmount,
      finalAmount: cart.totalAmount - cart.discountAmount,
      couponCode: cart.couponCode,
      couponId: cart.couponId,
      paymentMethod,
      billingAddress: billingAddress || {
        fullName: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: 'Vietnam'
      },
      notes
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const order = new Order(orderData);
    console.log('Order before save:', order.toObject());

    await order.save();
    console.log('Order after save:', order.toObject());

    // Increment coupon usage if applied
    if (coupon) {
      await coupon.incrementUsage();
    }

    // Clear cart after successful order creation
    cart.items = [];
    cart.totalAmount = 0;
    cart.totalOriginalAmount = 0;
    cart.discountAmount = 0;
    cart.couponCode = undefined;
    cart.couponId = undefined;
    await cart.save();

    // Populate order for response
    await order.populate([
      { path: 'courses.course', select: 'title slug thumbnail' },
      { path: 'couponId', select: 'code discountType discountValue' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

/**
 * @swagger
 * /orders/{id}/payment/zalopay:
 *   post:
 *     summary: Create ZaloPay payment for order
 *     tags: [Orders]
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
 *         description: ZaloPay payment URL created
 */
router.post('/:id/payment/zalopay', authenticate, requireEmailVerification, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const orderId = req.params.id;

    // Find order
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check if order can be paid
    if (order.paymentStatus !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Order payment is not pending'
      });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prepare ZaloPay order data
    const zaloPayOrderData = {
      orderId: order.orderNumber,
      amount: Math.round(order.totalAmount), // ZaloPay requires integer amount
      description: `Course Management - Order ${order.orderNumber}`,
      userEmail: user.email,
      items: order.courses.map((item: any) => ({
        name: item.title,
        price: Math.round(item.price),
        quantity: 1
      })),
      embedData: {
        orderId: order._id.toString(),
        userId: userId.toString()
      }
    };

    // Create ZaloPay order
    const zaloPayResponse = await zaloPayService.createOrder(zaloPayOrderData);

    if (zaloPayResponse.return_code === 1) {
      // Update order with ZaloPay transaction details
      order.paymentStatus = 'processing';
      order.paymentDetails = {
        ...order.paymentDetails,
        zaloPayTransId: (zaloPayResponse as any).app_trans_id,
        zaloPayResponse: JSON.stringify(zaloPayResponse)
      };
      await order.save();

      res.json({
        success: true,
        message: 'ZaloPay payment created successfully',
        data: {
          orderUrl: zaloPayResponse.order_url,
          zpTransToken: zaloPayResponse.zp_trans_token,
          qrCode: zaloPayResponse.qr_code,
          appTransId: (zaloPayResponse as any).app_trans_id
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: zaloPayResponse.return_message || 'Failed to create ZaloPay payment'
      });
    }
  } catch (error: any) {
    console.error('Error creating ZaloPay payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create ZaloPay payment'
    });
  }
});

/**
 * @swagger
 * /orders/zalopay/callback:
 *   post:
 *     summary: ZaloPay payment callback
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post('/zalopay/callback', async (req, res) => {
  try {
    console.log('=== ZALOPAY CALLBACK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Raw body type:', typeof req.body);
    console.log('Content-Type:', req.headers['content-type']);

    // Verify callback
    const isValidSignature = zaloPayService.verifyCallback(req.body);
    console.log('Signature verification result:', isValidSignature);

    if (!isValidSignature) {
      console.error('❌ Invalid callback signature');
      console.log('Expected signature calculation details:');
      console.log('- Data:', req.body.data);
      console.log('- MAC:', req.body.mac);
      res.json({ return_code: -1, return_message: 'Invalid signature' });
      return;
    }

    // Parse callback data
    const callbackData = zaloPayService.parseCallbackData(req.body);
    console.log('Parsed callback data:', JSON.stringify(callbackData, null, 2));

    if (!callbackData) {
      console.error('❌ Invalid callback data');
      res.json({ return_code: -1, return_message: 'Invalid data' });
      return;
    }

    const { app_trans_id, amount, server_time } = callbackData;
    console.log('Transaction details:', { app_trans_id, amount, server_time });

    // Find order by ZaloPay transaction ID
    console.log('🔍 Searching for order with zaloPayTransId:', app_trans_id);

    const order = await Order.findOne({
      'paymentDetails.zaloPayTransId': app_trans_id
    });

    console.log('📋 Order search result:', order ? `Found order ${order.orderNumber}` : 'No order found');

    if (!order) {
      console.error('❌ Order not found for transaction:', app_trans_id);

      // Try to find by any transaction ID for debugging
      const allOrders = await Order.find({}).select('orderNumber paymentDetails').limit(10);
      console.log('🔍 Recent orders for debugging:', allOrders.map(o => ({
        orderNumber: o.orderNumber,
        zaloPayTransId: o.paymentDetails?.zaloPayTransId,
        transactionId: o.paymentDetails?.transactionId
      })));

      res.json({ return_code: -1, return_message: 'Order not found' });
      return;
    }

    console.log('📝 Updating order status...');
    console.log('Current order status:', {
      paymentStatus: order.paymentStatus,
      status: order.status,
      orderNumber: order.orderNumber
    });

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'completed';
    order.completedAt = new Date();
    order.paymentDetails = {
      ...order.paymentDetails,
      paidAt: new Date(),
      gatewayResponse: callbackData
    };

    await order.save();
    console.log('✅ Order updated successfully:', {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status
    });

    // Update course enrollment counts
    console.log('📚 Updating course enrollment counts...');
    for (const item of order.courses) {
      await Course.findByIdAndUpdate(
        item.course,
        { $inc: { enrolledStudents: 1 } }
      );
      console.log(`✅ Updated enrollment for course: ${item.title}`);
    }

    console.log('🎉 Payment completed successfully for order:', order.orderNumber);

    res.json({ return_code: 1, return_message: 'success' });
  } catch (error: any) {
    console.error('❌ ZaloPay callback error:', error);
    console.error('Error stack:', error.stack);
    res.json({ return_code: -1, return_message: 'Internal error' });
  }
});

/**
 * @swagger
 * /orders/{id}/payment/status:
 *   get:
 *     summary: Check payment status
 *     tags: [Orders]
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
 *         description: Payment status retrieved
 */
router.get('/:id/payment/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // If payment is processing and we have ZaloPay transaction ID, query status
    if (order.paymentStatus === 'processing' && order.paymentDetails?.zaloPayTransId) {
      try {
        const queryResult = await zaloPayService.queryOrder(order.paymentDetails.zaloPayTransId);

        if (queryResult.return_code === 1) {
          // Payment successful
          order.paymentStatus = 'paid';
          order.status = 'completed';
          order.completedAt = new Date();
          order.paymentDetails.paidAt = new Date();
          await order.save();

          // Update course enrollment counts
          for (const item of order.courses) {
            await Course.findByIdAndUpdate(
              item.course,
              { $inc: { enrolledStudents: 1 } }
            );
          }
        } else if (queryResult.return_code === 2) {
          // Payment failed
          order.paymentStatus = 'failed';
          await order.save();
        }
      } catch (queryError) {
        console.error('Error querying ZaloPay status:', queryError);
      }
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

/**
 * @swagger
 * /orders/zalopay/test-callback:
 *   post:
 *     summary: Test ZaloPay callback manually
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               app_trans_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test callback processed
 */
router.post('/zalopay/test-callback', async (req, res) => {
  try {
    const { app_trans_id } = req.body;

    console.log('🧪 Testing callback for transaction:', app_trans_id);

    // Find order by transaction ID
    const order = await Order.findOne({
      'paymentDetails.zaloPayTransId': app_trans_id
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
        app_trans_id
      });
      return;
    }

    // Simulate successful payment
    order.paymentStatus = 'paid';
    order.status = 'completed';
    order.completedAt = new Date();
    order.paymentDetails = {
      ...order.paymentDetails,
      paidAt: new Date(),
      gatewayResponse: { test: true, app_trans_id }
    };

    await order.save();

    // Update course enrollment
    for (const item of order.courses) {
      await Course.findByIdAndUpdate(
        item.course,
        { $inc: { enrolledStudents: 1 } }
      );
    }

    res.json({
      success: true,
      message: 'Test callback processed successfully',
      order: {
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status
      }
    });
  } catch (error: any) {
    console.error('Test callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
