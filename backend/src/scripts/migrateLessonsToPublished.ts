import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Assignment from '../models/Assignment';

async function migrateLessonsToPublished() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 MIGRATING LESSONS TO PUBLISHED STATUS');
    console.log('=' .repeat(80));

    // 1. Get all courses that are published
    console.log('\n📚 1. FINDING PUBLISHED COURSES:');
    console.log('-' .repeat(50));
    
    const publishedCourses = await Course.find({
      isPublished: true,
      status: 'published'
    }).select('_id title').lean();
    
    console.log(`Found ${publishedCourses.length} published courses`);
    publishedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (${course._id})`);
    });

    // 2. Get all lessons for published courses
    console.log('\n📖 2. CHECKING LESSONS FOR PUBLISHED COURSES:');
    console.log('-' .repeat(50));
    
    const publishedCourseIds = publishedCourses.map(course => course._id);
    
    const allLessons = await Lesson.find({
      course: { $in: publishedCourseIds }
    }).select('_id title course isPublished order').lean();
    
    const unpublishedLessons = allLessons.filter(lesson => !lesson.isPublished);
    
    console.log(`Total lessons for published courses: ${allLessons.length}`);
    console.log(`Unpublished lessons: ${unpublishedLessons.length}`);
    console.log(`Already published lessons: ${allLessons.length - unpublishedLessons.length}`);

    // 3. Update unpublished lessons to published
    if (unpublishedLessons.length > 0) {
      console.log('\n🔄 3. UPDATING LESSONS TO PUBLISHED:');
      console.log('-' .repeat(50));
      
      const updateResult = await Lesson.updateMany(
        {
          course: { $in: publishedCourseIds },
          isPublished: false
        },
        {
          $set: { isPublished: true }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} lessons to published status`);
    } else {
      console.log('\n✅ All lessons for published courses are already published');
    }

    // 4. Update assignments for published courses
    console.log('\n📝 4. UPDATING ASSIGNMENTS FOR PUBLISHED COURSES:');
    console.log('-' .repeat(50));
    
    const allAssignments = await Assignment.find({
      course: { $in: publishedCourseIds }
    }).select('_id title course isPublished').lean();
    
    const unpublishedAssignments = allAssignments.filter(assignment => !assignment.isPublished);
    
    console.log(`Total assignments for published courses: ${allAssignments.length}`);
    console.log(`Unpublished assignments: ${unpublishedAssignments.length}`);
    
    if (unpublishedAssignments.length > 0) {
      const assignmentUpdateResult = await Assignment.updateMany(
        {
          course: { $in: publishedCourseIds },
          isPublished: false
        },
        {
          $set: { isPublished: true }
        }
      );
      
      console.log(`✅ Updated ${assignmentUpdateResult.modifiedCount} assignments to published status`);
    } else {
      console.log('✅ All assignments for published courses are already published');
    }

    // 5. Verify the changes
    console.log('\n🔍 5. VERIFYING CHANGES:');
    console.log('-' .repeat(50));
    
    const verifyLessons = await Lesson.find({
      course: { $in: publishedCourseIds }
    }).select('course isPublished').lean();
    
    const lessonsByCourse = verifyLessons.reduce((acc: any, lesson: any) => {
      const courseId = lesson.course.toString();
      if (!acc[courseId]) {
        acc[courseId] = { total: 0, published: 0 };
      }
      acc[courseId].total++;
      if (lesson.isPublished) {
        acc[courseId].published++;
      }
      return acc;
    }, {});
    
    console.log('Lessons status by course:');
    for (const course of publishedCourses) {
      const courseId = course._id.toString();
      const stats = lessonsByCourse[courseId] || { total: 0, published: 0 };
      console.log(`${course.title}: ${stats.published}/${stats.total} published`);
    }

    // 6. Test the specific course
    console.log('\n🎯 6. TESTING SPECIFIC COURSE (684a30786e5709e50d55340f):');
    console.log('-' .repeat(50));
    
    const testCourseId = '684a30786e5709e50d55340f';
    const testLessons = await Lesson.find({ 
      course: testCourseId, 
      isPublished: true 
    }).select('title order').sort({ order: 1 }).lean();
    
    console.log(`Published lessons for test course: ${testLessons.length}`);
    testLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. ${lesson.title} (order: ${lesson.order})`);
    });

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the migration
migrateLessonsToPublished();
