import express from 'express';
import Notification from '@/models/Notification';
import { auth } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = express.Router();

// GET /api/notifications - Get notifications for authenticated user
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      unreadOnly: unreadOnly === 'true'
    };

    const result = await Notification.getNotificationsForUser(userId, options);

    return res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const count = await Notification.getUnreadCount(userId);

    return res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.isRead) {
      await notification.markAsRead();
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    const result = await Notification.markAsRead(userId);

    return res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/notifications/mark-selected-read - Mark selected notifications as read
router.put('/mark-selected-read', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs are required and must be an array'
      });
    }

    const result = await Notification.markAsRead(userId, notificationIds);

    return res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking selected notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// DELETE /api/notifications/:id - Delete specific notification
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/notifications/test - Create test notification (development only)
router.post('/test', auth, async (req: AuthRequest, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications only available in development'
      });
    }

    const userId = req.user!._id;
    const { type = 'system', title = 'Test Notification', message = 'This is a test notification' } = req.body;

    const notification = new Notification({
      recipient: userId,
      type,
      title,
      message,
      priority: 'medium'
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      message: 'Test notification created',
      data: notification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/notifications/test-assignment - Create test assignment submission notification
router.post('/test-assignment', auth, async (req: AuthRequest, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications only available in development'
      });
    }

    const userId = req.user!._id;

    // Create a test assignment submission notification
    const notification = await Notification.createAssignmentSubmissionNotification({
      instructorId: userId,
      studentName: 'Test Student',
      courseName: 'Complete Web Development Bootcamp',
      lessonName: 'Introduction to JavaScript',
      assignmentName: 'JavaScript Basics Quiz',
      submissionId: '507f1f77bcf86cd799439011',
      score: 85,
      percentage: 85,
      attemptNumber: 1,
      assignmentId: '684a7c9ae99c4ff251058a0d',
      courseId: '684a30786e5709e50d55340f'
    });

    return res.status(201).json({
      success: true,
      message: 'Test assignment notification created',
      data: notification
    });
  } catch (error) {
    console.error('Error creating test assignment notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test assignment notification',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
