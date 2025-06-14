import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireInstructor } from '@/middleware/auth';
import { AuthRequest } from '@/types';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import Assignment from '@/models/Assignment';
import { sendSuccess, sendError } from '@/utils/response';
import { getVideoUrl } from '@/utils/helpers';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save videos to frontend public directory for direct serving
    const uploadPath = path.join(process.cwd(), '..', 'frontend', 'public', 'videos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `lesson-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// GET /api/instructor/courses/:courseId/lessons - Get all lessons for a course
router.get('/courses/:courseId/lessons', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lessons = await Lesson.find({ course: courseId })
      .populate('assignments')
      .sort({ order: 1 });

    // Process video URLs for frontend serving
    const processedLessons = lessons.map(lesson => {
      const lessonObj = lesson.toObject();
      if (lessonObj.videoUrl) {
        lessonObj.videoUrl = getVideoUrl(lessonObj.videoUrl);
      }
      return lessonObj;
    });

    return sendSuccess(res, 'Lessons retrieved successfully', {
      lessons: processedLessons,
      total: lessons.length
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    return sendError(res, 'Failed to retrieve lessons', 500);
  }
});

// GET /api/instructor/courses/:courseId/lessons/:lessonId - Get specific lesson
router.get('/courses/:courseId/lessons/:lessonId', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId })
      .populate('assignments');

    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Process video URL for frontend serving
    const lessonObj = lesson.toObject();
    if (lessonObj.videoUrl) {
      lessonObj.videoUrl = getVideoUrl(lessonObj.videoUrl);
    }

    return sendSuccess(res, 'Lesson retrieved successfully', lessonObj);
  } catch (error) {
    console.error('Get lesson error:', error);
    return sendError(res, 'Failed to retrieve lesson', 500);
  }
});

// POST /api/instructor/courses/:courseId/lessons - Create new lesson
router.post('/courses/:courseId/lessons', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lessonData = {
      ...req.body,
      course: courseId
    };

    // Remove order from request body to let middleware handle it
    delete lessonData.order;

    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Update course lesson count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalLessons: 1 }
    });

    return sendSuccess(res, 'Lesson created successfully', lesson, 201);
  } catch (error: any) {
    console.error('Create lesson error:', error);
    if (error.name === 'ValidationError') {
      return sendError(res, 'Invalid lesson data', 400, error.errors);
    } else {
      return sendError(res, 'Failed to create lesson', 500);
    }
  }
});

// PUT /api/instructor/courses/:courseId/lessons/:lessonId - Update lesson
router.put('/courses/:courseId/lessons/:lessonId', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: lessonId, course: courseId },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignments');

    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Process video URL for frontend serving
    const lessonObj = lesson.toObject();
    if (lessonObj.videoUrl) {
      lessonObj.videoUrl = getVideoUrl(lessonObj.videoUrl);
    }

    return sendSuccess(res, 'Lesson updated successfully', lessonObj);
  } catch (error: any) {
    console.error('Update lesson error:', error);
    if (error.name === 'ValidationError') {
      return sendError(res, 'Invalid lesson data', 400, error.errors);
    } else {
      return sendError(res, 'Failed to update lesson', 500);
    }
  }
});

// DELETE /api/instructor/courses/:courseId/lessons/:lessonId - Delete lesson
router.delete('/courses/:courseId/lessons/:lessonId', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Delete associated assignments
    await Assignment.deleteMany({ lesson: lessonId });

    // Delete lesson video file if exists
    if (lesson.videoUrl && lesson.videoUrl.startsWith('/videos/')) {
      const videoPath = path.join(process.cwd(), '..', 'frontend', 'public', lesson.videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    // Delete lesson
    await Lesson.findByIdAndDelete(lessonId);

    // Update course lesson count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalLessons: -1 }
    });

    // Reorder remaining lessons
    const remainingLessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    const reorderOps = remainingLessons.map((l, index) => ({
      updateOne: {
        filter: { _id: l._id },
        update: { order: index + 1 }
      }
    }));

    if (reorderOps.length > 0) {
      await Lesson.bulkWrite(reorderOps);
    }

    return sendSuccess(res, 'Lesson deleted successfully');
  } catch (error) {
    console.error('Delete lesson error:', error);
    return sendError(res, 'Failed to delete lesson', 500);
  }
});

// POST /api/instructor/courses/:courseId/lessons/reorder - Reorder lessons
router.post('/courses/:courseId/lessons/reorder', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { lessonOrders } = req.body; // Array of { lessonId, order }
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    // Reorder lessons using bulkWrite
    const bulkOps = lessonOrders.map(({ lessonId, order }: { lessonId: string, order: number }) => ({
      updateOne: {
        filter: { _id: lessonId, course: courseId },
        update: { order }
      }
    }));

    await Lesson.bulkWrite(bulkOps);

    return sendSuccess(res, 'Lessons reordered successfully');
  } catch (error) {
    console.error('Reorder lessons error:', error);
    return sendError(res, 'Failed to reorder lessons', 500);
  }
});

// POST /api/instructor/courses/:courseId/lessons/:lessonId/video - Upload video for lesson
router.post('/courses/:courseId/lessons/:lessonId/video', authenticate, requireInstructor, upload.single('video'), async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    if (!req.file) {
      return sendError(res, 'No video file uploaded', 400);
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Delete old video file if exists
    if (lesson.videoUrl && lesson.videoUrl.startsWith('/videos/')) {
      const oldVideoPath = path.join(process.cwd(), '..', 'frontend', 'public', lesson.videoUrl);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }

    // Update lesson with video info - use frontend static serving path
    const videoUrl = `/videos/${req.file.filename}`;
    const videoFormat = path.extname(req.file.originalname).slice(1).toLowerCase();

    await Lesson.findByIdAndUpdate(lessonId, {
      videoUrl,
      videoSize: req.file.size,
      videoFormat,
      // videoDuration will be updated separately via another endpoint
    });

    return sendSuccess(res, 'Video uploaded successfully', {
      videoUrl: getVideoUrl(videoUrl),
      videoSize: req.file.size,
      videoFormat
    });
  } catch (error) {
    console.error('Upload video error:', error);
    return sendError(res, 'Failed to upload video', 500);
  }
});

// PUT /api/instructor/courses/:courseId/lessons/:lessonId/video/metadata - Update video metadata
router.put('/courses/:courseId/lessons/:lessonId/video/metadata', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { videoDuration, videoThumbnail } = req.body;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: lessonId, course: courseId },
      { videoDuration, videoThumbnail },
      { new: true }
    );

    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Process video URL for frontend serving
    const lessonObj = lesson.toObject();
    if (lessonObj.videoUrl) {
      lessonObj.videoUrl = getVideoUrl(lessonObj.videoUrl);
    }

    return sendSuccess(res, 'Video metadata updated successfully', lessonObj);
  } catch (error) {
    console.error('Update video metadata error:', error);
    return sendError(res, 'Failed to update video metadata', 500);
  }
});

// DELETE /api/instructor/courses/:courseId/lessons/:lessonId/video - Delete video from lesson
router.delete('/courses/:courseId/lessons/:lessonId/video', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Delete video file if exists
    if (lesson.videoUrl && lesson.videoUrl.startsWith('/videos/')) {
      const videoPath = path.join(process.cwd(), '..', 'frontend', 'public', lesson.videoUrl);
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
        } catch (error) {
          console.error('Failed to delete video file:', error);
          // Continue with database cleanup even if file deletion fails
        }
      }
    }

    // Remove video metadata from lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        $unset: {
          videoUrl: 1,
          videoThumbnail: 1,
          videoDuration: 1,
          videoSize: 1,
          videoFormat: 1
        }
      },
      { new: true }
    ).populate('assignments');

    if (!updatedLesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    // Process video URL for frontend serving
    const lessonObj = updatedLesson.toObject();
    if (lessonObj.videoUrl) {
      lessonObj.videoUrl = getVideoUrl(lessonObj.videoUrl);
    }

    return sendSuccess(res, 'Video deleted successfully', lessonObj);
  } catch (error) {
    console.error('Delete video error:', error);
    return sendError(res, 'Failed to delete video', 500);
  }
});

// Assignment Management Routes

// GET /api/instructor/courses/:courseId/lessons/:lessonId/assignments - Get assignments for lesson
router.get('/courses/:courseId/lessons/:lessonId/assignments', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const assignments = await Assignment.find({ lesson: lessonId, course: courseId })
      .populate('lesson', 'title order')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Assignments retrieved successfully', {
      assignments,
      total: assignments.length
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return sendError(res, 'Failed to retrieve assignments', 500);
  }
});

// POST /api/instructor/courses/:courseId/lessons/:lessonId/assignments - Create assignment
router.post('/courses/:courseId/lessons/:lessonId/assignments', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    // Verify lesson exists
    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return sendError(res, 'Lesson not found', 404);
    }

    const assignmentData = {
      ...req.body,
      lesson: lessonId,
      course: courseId
    };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // Add assignment to lesson
    await Lesson.findByIdAndUpdate(lessonId, {
      $push: { assignments: assignment._id }
    });

    return sendSuccess(res, 'Assignment created successfully', assignment, 201);
  } catch (error: any) {
    console.error('Create assignment error:', error);
    if (error.name === 'ValidationError') {
      return sendError(res, 'Invalid assignment data', 400, error.errors);
    } else {
      return sendError(res, 'Failed to create assignment', 500);
    }
  }
});

// PUT /api/instructor/courses/:courseId/assignments/:assignmentId - Update assignment
router.put('/courses/:courseId/assignments/:assignmentId', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, assignmentId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, course: courseId },
      req.body,
      { new: true, runValidators: true }
    ).populate('lesson', 'title order');

    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    return sendSuccess(res, 'Assignment updated successfully', assignment);
  } catch (error: any) {
    console.error('Update assignment error:', error);
    if (error.name === 'ValidationError') {
      return sendError(res, 'Invalid assignment data', 400, error.errors);
    } else {
      return sendError(res, 'Failed to update assignment', 500);
    }
  }
});

// DELETE /api/instructor/courses/:courseId/assignments/:assignmentId - Delete assignment
router.delete('/courses/:courseId/assignments/:assignmentId', authenticate, requireInstructor, async (req: AuthRequest, res) => {
  try {
    const { courseId, assignmentId } = req.params;
    const instructorId = req.user!._id;

    // Verify course ownership
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return sendError(res, 'Course not found or access denied', 404);
    }

    const assignment = await Assignment.findOne({ _id: assignmentId, course: courseId });
    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    // Remove assignment from lesson
    await Lesson.findByIdAndUpdate(assignment.lesson, {
      $pull: { assignments: assignmentId }
    });

    // Delete assignment
    await Assignment.findByIdAndDelete(assignmentId);

    return sendSuccess(res, 'Assignment deleted successfully');
  } catch (error) {
    console.error('Delete assignment error:', error);
    return sendError(res, 'Failed to delete assignment', 500);
  }
});

export default router;
