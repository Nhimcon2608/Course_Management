import express from 'express';
import mongoose from 'mongoose';
import Assignment from '@/models/Assignment';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Order from '@/models/Order';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { auth, requireCourseEnrollment } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = express.Router();

// GET /api/learning/assignments/:assignmentId/submission - Get student's submission for assignment
router.get('/:assignmentId/submission', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { assignmentId } = req.params;

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'title instructor')
      .populate('lesson', 'title order');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user has valid enrollment
    const enrollment = await Order.findOne({
      user: userId,
      'courses.course': assignment.course,
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

    // Get student's submissions for this assignment
    const submissions = await AssignmentSubmission.find({
      student: userId,
      assignment: assignmentId
    }).sort({ attemptNumber: -1 });

    // Get attempt count
    const attemptCount = submissions.length;

    return res.json({
      success: true,
      message: 'Submission data retrieved successfully',
      data: {
        assignment,
        submissions,
        attemptCount,
        canSubmit: attemptCount < assignment.attempts && 
                   (!assignment.deadline || new Date() <= new Date(assignment.deadline))
      }
    });
  } catch (error) {
    console.error('Error fetching assignment submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment submission',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/learning/assignments/:assignmentId/submit - Submit assignment
router.post('/:assignmentId/submit', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { assignmentId } = req.params;
    const { answers, timeSpent, startedAt } = req.body;

    // Validate required fields
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required and must be an array'
      });
    }

    // Check if assignment exists and is published
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      isPublished: true
    }).populate('course', 'title instructor')
      .populate('lesson', 'title order');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or not published'
      });
    }

    // Check if user is enrolled in the course (not cancelled)
    const enrollment = await Order.findOne({
      user: userId,
      'courses.course': assignment.course._id,
      status: 'completed', // Must be completed
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

    // Check deadline
    if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }

    // Check attempt limit
    const attemptCount = await AssignmentSubmission.getAttemptCount(userId, assignmentId);
    if (attemptCount >= assignment.attempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of attempts reached'
      });
    }

    // Auto-grade multiple choice questions
    let totalScore = 0;
    const gradedAnswers = answers.map((answer: any) => {
      const question = assignment.questions.find(q => q._id?.toString() === answer.questionId);
      if (!question) {
        return { ...answer, points: 0, isCorrect: false };
      }

      let isCorrect = false;
      let points = 0;

      if (question.type === 'multiple_choice' && question.correctAnswer !== undefined) {
        isCorrect = answer.answer === question.correctAnswer;
        points = isCorrect ? question.points : 0;
      } else {
        // For non-multiple choice, assign full points for now (manual grading needed)
        points = question.points;
        isCorrect = true; // Will be updated during manual grading
      }

      totalScore += points;

      return {
        ...answer,
        points,
        isCorrect,
        gradedAt: question.type === 'multiple_choice' ? new Date() : undefined
      };
    });

    // Create submission
    const submission = new AssignmentSubmission({
      student: userId,
      assignment: assignmentId,
      course: assignment.course._id,
      lesson: assignment.lesson._id,
      answers: gradedAnswers,
      score: totalScore,
      maxScore: assignment.totalPoints,
      attemptNumber: attemptCount + 1,
      timeSpent: timeSpent || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      isLate: assignment.deadline ? new Date() > new Date(assignment.deadline) : false,
      status: assignment.autoGrade ? 'graded' : 'submitted'
    });

    await submission.save();

    // Get student and instructor information for notification
    const student = await User.findById(userId).select('name email');
    const instructor = await User.findById((assignment.course as any).instructor).select('_id');

    // Create notification for instructor
    if (instructor && student) {
      await Notification.createAssignmentSubmissionNotification({
        instructorId: instructor._id.toString(),
        studentName: student.name,
        courseName: (assignment.course as any).title,
        lessonName: (assignment.lesson as any).title,
        assignmentName: assignment.title,
        submissionId: submission._id.toString(),
        score: totalScore,
        percentage: submission.percentage,
        attemptNumber: submission.attemptNumber,
        assignmentId: assignmentId,
        courseId: assignment.course._id.toString()
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submission: {
          _id: submission._id,
          score: submission.score,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          attemptNumber: submission.attemptNumber,
          status: submission.status,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate
        }
      }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/learning/assignments/:assignmentId/save-draft - Save assignment draft
router.post('/:assignmentId/save-draft', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { assignmentId } = req.params;
    const { answers, timeSpent, startedAt } = req.body;

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check enrollment
    const enrollment = await Order.findOne({
      user: userId,
      'courses.course': assignment.course,
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

    // Find existing draft or create new one
    let draft = await AssignmentSubmission.findOne({
      student: userId,
      assignment: assignmentId,
      status: 'draft'
    });

    if (draft) {
      // Update existing draft
      draft.answers = answers || [];
      draft.timeSpent = timeSpent || 0;
      draft.startedAt = startedAt ? new Date(startedAt) : draft.startedAt;
      await draft.save();
    } else {
      // Create new draft
      draft = new AssignmentSubmission({
        student: userId,
        assignment: assignmentId,
        course: assignment.course,
        lesson: assignment.lesson,
        answers: answers || [],
        score: 0,
        maxScore: assignment.totalPoints,
        attemptNumber: 0, // Drafts don't count as attempts
        timeSpent: timeSpent || 0,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        status: 'draft'
      });
      await draft.save();
    }

    return res.json({
      success: true,
      message: 'Draft saved successfully',
      data: { draftId: draft._id }
    });
  } catch (error) {
    console.error('Error saving assignment draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
