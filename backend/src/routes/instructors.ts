import express from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '@/utils/response';
import Instructor from '@/models/Instructor';
import InstructorApplication from '@/models/InstructorApplication';
import User from '@/models/User';
import Course from '@/models/Course';

const router = express.Router();

/**
 * @swagger
 * /instructors:
 *   get:
 *     summary: Get all instructors (public)
 *     tags: [Public Instructors]
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
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: expertise
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, studentsCount, name, joinedDate]
 *           default: rating
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Instructors retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const expertise = req.query.expertise as string;
    const rating = parseFloat(req.query.rating as string);
    const sortBy = req.query.sortBy as string || 'rating';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      status: 'active',
      verified: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { expertise: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (expertise) {
      query.expertise = { $in: [new RegExp(expertise, 'i')] };
    }

    if (rating && !isNaN(rating)) {
      query.rating = { $gte: rating };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get instructors
    const instructors = await Instructor.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-userId -totalEarnings -status');

    const total = await Instructor.countDocuments(query);

    // Get unique expertise areas for filtering
    const expertiseAreas = await Instructor.distinct('expertise', { status: 'active', verified: true });

    sendSuccess(res, 'Instructors retrieved successfully', {
      instructors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        expertiseAreas: expertiseAreas.sort()
      }
    });
  } catch (error) {
    console.error('Get instructors error:', error);
    sendError(res, 'Failed to retrieve instructors', 500);
  }
});

/**
 * @swagger
 * /instructors/featured:
 *   get:
 *     summary: Get featured instructors (public)
 *     tags: [Public Instructors]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Featured instructors retrieved successfully
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const instructors = await Instructor.find({
      featured: true,
      status: 'active',
      verified: true
    })
      .sort({ rating: -1, studentsCount: -1 })
      .limit(limit)
      .select('-userId -totalEarnings -status');

    sendSuccess(res, 'Featured instructors retrieved successfully', { instructors });
  } catch (error) {
    console.error('Get featured instructors error:', error);
    sendError(res, 'Failed to retrieve featured instructors', 500);
  }
});

/**
 * @swagger
 * /instructors/{id}:
 *   get:
 *     summary: Get instructor profile (public)
 *     tags: [Public Instructors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor profile retrieved successfully
 *       404:
 *         description: Instructor not found
 */
router.get('/:id', async (req, res) => {
  try {
    const instructorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      sendError(res, 'Invalid instructor ID', 400);
      return;
    }

    const instructor = await Instructor.findOne({
      _id: instructorId,
      status: 'active'
    }).select('-userId -totalEarnings -status');

    if (!instructor) {
      sendError(res, 'Instructor not found', 404);
      return;
    }

    // Get instructor's courses
    const courses = await Course.find({
      instructor: instructor.userId,
      isPublished: true
    })
      .select('title description price rating thumbnail level duration enrolledStudents')
      .sort({ createdAt: -1 });

    // Get instructor stats
    const stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0),
      averageRating: instructor.rating,
      totalReviews: courses.reduce((sum, course) => sum + ((course as any).reviewCount || 0), 0)
    };

    sendSuccess(res, 'Instructor profile retrieved successfully', {
      instructor,
      courses,
      stats
    });
  } catch (error) {
    console.error('Get instructor profile error:', error);
    sendError(res, 'Failed to retrieve instructor profile', 500);
  }
});

/**
 * @swagger
 * /instructors/apply:
 *   post:
 *     summary: Submit instructor application
 *     tags: [Public Instructors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - location
 *               - currentTitle
 *               - experience
 *               - expertise
 *               - bio
 *               - motivation
 *               - agreedToTerms
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               currentTitle:
 *                 type: string
 *               company:
 *                 type: string
 *               experience:
 *                 type: string
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *               teachingExperience:
 *                 type: string
 *               motivation:
 *                 type: string
 *               sampleCourseTitle:
 *                 type: string
 *               sampleCourseDescription:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               website:
 *                 type: string
 *               github:
 *                 type: string
 *               portfolio:
 *                 type: string
 *               hearAboutUs:
 *                 type: string
 *               agreedToTerms:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid application data
 */
router.post('/apply', async (req, res) => {
  try {
    const applicationData = req.body;

    // Create new application
    const application = new InstructorApplication(applicationData);
    await application.save();

    sendSuccess(res, 'Application submitted successfully', {
      applicationId: application._id,
      status: application.status
    }, 201);
  } catch (error: any) {
    console.error('Submit instructor application error:', error);
    if (error.name === 'ValidationError') {
      sendError(res, 'Invalid application data', 400, error.errors);
    } else if (error.message.includes('application with this email already exists')) {
      sendError(res, 'An application with this email already exists', 400);
    } else {
      sendError(res, 'Failed to submit application', 500);
    }
  }
});

export default router;
