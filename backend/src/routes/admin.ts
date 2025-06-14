import express from 'express';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { AuthRequest } from '@/types';
import {
  getAdminStats,
  getUserManagement,
  updateUserRole,
  toggleUserStatus,
  getCourseManagement,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getOrderManagement,
  updateOrderStatus,
  processOrderRefund,
  getSystemSettings,
  updateSystemSettings,
  createUser,
  updateUserProfile,
  deleteUser,
  bulkUserOperations,
  getAnalytics,
  getSystemHealth
} from '@/controllers/adminController';

const router = express.Router();

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authenticate, requireAdmin, getAdminStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get user management data
 *     tags: [Admin]
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *       - in: query
 *         name: isEmailVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', authenticate, requireAdmin, getUserManagement);

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put('/users/:userId/role', authenticate, requireAdmin, updateUserRole);

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   put:
 *     summary: Toggle user active status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.put('/users/:userId/status', authenticate, requireAdmin, toggleUserStatus);

/**
 * @swagger
 * /admin/courses:
 *   get:
 *     summary: Get course management data
 *     tags: [Admin]
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/courses', authenticate, requireAdmin, getCourseManagement);

/**
 * @swagger
 * /admin/courses/{courseId}/status:
 *   put:
 *     summary: Update course status (approve/reject)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course status updated successfully
 */
router.put('/courses/:courseId/status', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { status, reason } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status specified'
      });
      return;
    }

    const Course = require('@/models/Course').default;
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    course.status = status;
    if (status === 'published') {
      course.isPublished = true;
    } else if (status === 'archived') {
      course.isPublished = false;
    }

    await course.save();

    // TODO: Send notification to instructor about status change
    // if (reason) {
    //   await sendNotificationToInstructor(course.instructor, status, reason);
    // }

    res.json({
      success: true,
      message: `Course ${status} successfully`,
      data: { course }
    });
  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status'
    });
  }
});

/**
 * @swagger
 * /admin/courses/{courseId}/featured:
 *   put:
 *     summary: Toggle course featured status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course featured status updated successfully
 */
router.put('/courses/:courseId/featured', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { courseId } = req.params;

    const Course = require('@/models/Course').default;
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      });
      return;
    }

    course.featured = !course.featured;
    await course.save();

    res.json({
      success: true,
      message: `Course ${course.featured ? 'featured' : 'unfeatured'} successfully`,
      data: { course }
    });
  } catch (error) {
    console.error('Toggle course featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course featured status'
    });
  }
});

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create new category
 *     tags: [Admin]
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
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/categories', authenticate, requireAdmin, createCategory);

/**
 * @swagger
 * /admin/categories/{categoryId}:
 *   put:
 *     summary: Update category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/categories/:categoryId', authenticate, requireAdmin, updateCategory);

/**
 * @swagger
 * /admin/categories/{categoryId}:
 *   delete:
 *     summary: Delete category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/categories/:categoryId', authenticate, requireAdmin, deleteCategory);

/**
 * @swagger
 * /admin/categories/{categoryId}/toggle-status:
 *   put:
 *     summary: Toggle category status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category status updated successfully
 */
router.put('/categories/:categoryId/toggle-status', authenticate, requireAdmin, toggleCategoryStatus);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get order management data
 *     tags: [Admin]
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled, refunded]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders', authenticate, requireAdmin, getOrderManagement);

/**
 * @swagger
 * /admin/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.put('/orders/:orderId/status', authenticate, requireAdmin, updateOrderStatus);

/**
 * @swagger
 * /admin/orders/{orderId}/refund:
 *   post:
 *     summary: Process order refund
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order refunded successfully
 */
router.post('/orders/:orderId/refund', authenticate, requireAdmin, processOrderRefund);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 */
router.get('/settings', authenticate, requireAdmin, getSystemSettings);

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               general:
 *                 type: object
 *               email:
 *                 type: object
 *               payment:
 *                 type: object
 *               security:
 *                 type: object
 *               notifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: System settings updated successfully
 */
router.put('/settings', authenticate, requireAdmin, updateSystemSettings);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user
 *     tags: [Admin]
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *               password:
 *                 type: string
 *               sendWelcomeEmail:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', authenticate, requireAdmin, createUser);

/**
 * @swagger
 * /admin/users/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 */
router.put('/users/:userId', authenticate, requireAdmin, updateUserProfile);

/**
 * @swagger
 * /admin/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:userId', authenticate, requireAdmin, deleteUser);

/**
 * @swagger
 * /admin/users/bulk:
 *   post:
 *     summary: Bulk user operations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [activate, deactivate, changeRole, delete]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 */
router.post('/users/bulk', authenticate, requireAdmin, bulkUserOperations);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [overview, revenue, users, courses, system]
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/analytics', authenticate, requireAdmin, getAnalytics);

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     summary: Get system health and monitoring data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health data retrieved successfully
 */
router.get('/system/health', authenticate, requireAdmin, getSystemHealth);

export default router;
