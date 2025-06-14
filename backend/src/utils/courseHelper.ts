import mongoose from 'mongoose';
import Course from '@/models/Course';

/**
 * Helper function to safely find a course by ObjectId or slug
 * This prevents ObjectId casting errors when using slugs
 */
export const findCourseByIdOrSlug = async (identifier: string, additionalFilter: any = {}) => {
  try {
    // Check if identifier is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    
    let query;
    if (isValidObjectId) {
      // If it's a valid ObjectId, search by both _id and slug for safety
      query = {
        $or: [{ _id: identifier }, { slug: identifier }],
        ...additionalFilter
      };
    } else {
      // If it's not a valid ObjectId, search only by slug
      query = {
        slug: identifier,
        ...additionalFilter
      };
    }
    
    const course = await Course.findOne(query);
    return course;
  } catch (error) {
    console.error('Error in findCourseByIdOrSlug:', error);
    // If there's any error, try to find by slug only as fallback
    try {
      return await Course.findOne({ slug: identifier, ...additionalFilter });
    } catch (fallbackError) {
      console.error('Fallback error in findCourseByIdOrSlug:', fallbackError);
      return null;
    }
  }
};

/**
 * Helper function to safely get course ObjectId from identifier
 * Returns the ObjectId if course is found, null otherwise
 */
export const getCourseObjectId = async (identifier: string): Promise<mongoose.Types.ObjectId | null> => {
  try {
    const course = await findCourseByIdOrSlug(identifier, { 
      isPublished: true, 
      status: 'published' 
    });
    return course ? course._id : null;
  } catch (error) {
    console.error('Error in getCourseObjectId:', error);
    return null;
  }
};

/**
 * Middleware to safely handle course ID parameters
 * Use this in routes that accept course identifiers
 */
export const validateCourseId = async (req: any, res: any, next: any) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await findCourseByIdOrSlug(courseId, {
      isPublished: true,
      status: 'published'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Attach course to request object for use in route handlers
    req.course = course;
    req.courseId = course._id;
    next();
  } catch (error) {
    console.error('Error in validateCourseId middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating course ID'
    });
  }
};
