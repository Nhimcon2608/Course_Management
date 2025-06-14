import express from 'express';
import mongoose from 'mongoose';
import Assignment from '@/models/Assignment';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import Course from '@/models/Course';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { auth } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = express.Router();

// GET /api/instructor/courses/:courseId/assignments/:assignmentId/submissions
router.get('/:courseId/assignments/:assignmentId/submissions', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId, assignmentId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'submittedAt', 
      sortOrder = 'desc',
      status,
      minScore,
      maxScore,
      startDate,
      endDate,
      search
    } = req.query;

    // Verify instructor owns the course
    const course = await Course.findOne({ _id: courseId, instructor: userId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Verify assignment belongs to the course
    const assignment = await Assignment.findOne({ _id: assignmentId, course: courseId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Build query filters
    const query: any = { 
      assignment: assignmentId,
      status: { $ne: 'draft' } // Exclude drafts
    };

    if (status) {
      query.status = status;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      query.score = {};
      if (minScore !== undefined) query.score.$gte = parseInt(minScore as string);
      if (maxScore !== undefined) query.score.$lte = parseInt(maxScore as string);
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Fetch submissions with student details
    let submissionsQuery = AssignmentSubmission.find(query)
      .populate('student', 'name email avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Add search functionality
    if (search) {
      const students = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
      
      submissionsQuery = AssignmentSubmission.find(query)
        .populate('student', 'name email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);
    }

    const submissions = await submissionsQuery;
    const totalSubmissions = await AssignmentSubmission.countDocuments(query);

    // Get assignment statistics
    const stats = await AssignmentSubmission.aggregate([
      { $match: { assignment: new mongoose.Types.ObjectId(assignmentId), status: { $ne: 'draft' } } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averagePercentage: { $avg: '$percentage' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          passCount: {
            $sum: {
              $cond: [{ $gte: ['$percentage', assignment.passingScore] }, 1, 0]
            }
          },
          lateCount: {
            $sum: {
              $cond: ['$isLate', 1, 0]
            }
          }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalSubmissions: 0,
      averageScore: 0,
      averagePercentage: 0,
      maxScore: 0,
      minScore: 0,
      passCount: 0,
      lateCount: 0
    };

    // Calculate additional stats
    statistics.passRate = statistics.totalSubmissions > 0 
      ? Math.round((statistics.passCount / statistics.totalSubmissions) * 100) 
      : 0;
    statistics.completionRate = statistics.totalSubmissions; // This would need enrollment data for accurate calculation

    return res.json({
      success: true,
      message: 'Submissions retrieved successfully',
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          totalPoints: assignment.totalPoints,
          passingScore: assignment.passingScore,
          deadline: assignment.deadline,
          timeLimit: assignment.timeLimit,
          attempts: assignment.attempts,
          isPublished: assignment.isPublished,
          questions: assignment.questions
        },
        course: {
          _id: course._id,
          title: course.title
        },
        submissions,
        statistics,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalSubmissions,
          pages: Math.ceil(totalSubmissions / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment submissions',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/instructor/courses/:courseId/assignments/:assignmentId/submissions/:submissionId
router.get('/:courseId/assignments/:assignmentId/submissions/:submissionId', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId, assignmentId, submissionId } = req.params;

    // Verify instructor owns the course
    const course = await Course.findOne({ _id: courseId, instructor: userId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Fetch detailed submission
    const submission = await AssignmentSubmission.findOne({
      _id: submissionId,
      assignment: assignmentId
    })
    .populate('student', 'name email avatar')
    .populate('assignment', 'title questions totalPoints passingScore')
    .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    return res.json({
      success: true,
      message: 'Submission details retrieved successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submission details',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/instructor/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/grade
router.put('/:courseId/assignments/:assignmentId/submissions/:submissionId/grade', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const { courseId, assignmentId, submissionId } = req.params;
    const { answers, feedback, status = 'graded' } = req.body;

    // Verify instructor owns the course
    const course = await Course.findOne({ _id: courseId, instructor: userId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Find submission
    const submission = await AssignmentSubmission.findOne({
      _id: submissionId,
      assignment: assignmentId
    }).populate('student', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update answers with grading information
    if (answers && Array.isArray(answers)) {
      submission.answers = submission.answers.map(answer => {
        const updatedAnswer = answers.find(a => a.questionId === answer.questionId);
        if (updatedAnswer) {
          return {
            ...answer,
            points: updatedAnswer.points || answer.points,
            feedback: updatedAnswer.feedback || answer.feedback,
            gradedAt: new Date(),
            isCorrect: updatedAnswer.isCorrect !== undefined ? updatedAnswer.isCorrect : answer.isCorrect
          };
        }
        return answer;
      });

      // Recalculate total score
      submission.score = submission.answers.reduce((total, answer) => total + (answer.points || 0), 0);
    }

    // Update submission metadata
    submission.feedback = feedback || submission.feedback;
    submission.status = status;
    submission.gradedAt = new Date();
    submission.gradedBy = new mongoose.Types.ObjectId(userId);

    await submission.save();

    // Create notification for student
    if (status === 'graded') {
      await Notification.create({
        recipient: submission.student._id,
        type: 'assignment_graded',
        title: 'Assignment Graded',
        message: `Your assignment "${(submission as any).assignment?.title || 'Assignment'}" has been graded`,
        relatedId: submission._id,
        relatedType: 'submission',
        metadata: {
          courseName: course.title,
          assignmentName: (submission as any).assignment?.title,
          score: submission.score,
          percentage: submission.percentage
        },
        priority: 'medium',
        actionUrl: `/learning/courses/${courseId}/assignments/${assignmentId}/result`
      });
    }

    return res.json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to grade submission',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
