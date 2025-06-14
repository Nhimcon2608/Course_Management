import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Assignment from '../models/Assignment';

async function forcePublishAllLessons() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 FORCE PUBLISHING ALL LESSONS FOR PUBLISHED COURSES');
    console.log('=' .repeat(80));

    // 1. Get all published courses
    const publishedCourses = await Course.find({
      isPublished: true,
      status: 'published'
    }).select('_id title').lean();
    
    console.log(`\n📚 Found ${publishedCourses.length} published courses`);

    // 2. Get all lessons for these courses
    const publishedCourseIds = publishedCourses.map(course => course._id);
    
    const allLessons = await Lesson.find({
      course: { $in: publishedCourseIds }
    }).lean();
    
    console.log(`📖 Found ${allLessons.length} lessons for published courses`);

    // 3. Force update ALL lessons to published
    console.log('\n🔄 Force updating ALL lessons to published...');
    
    const updateResult = await Lesson.updateMany(
      { course: { $in: publishedCourseIds } },
      { $set: { isPublished: true } }
    );
    
    console.log(`✅ Force updated ${updateResult.modifiedCount} lessons`);

    // 4. Force update ALL assignments to published
    console.log('\n📝 Force updating ALL assignments to published...');
    
    const assignmentUpdateResult = await Assignment.updateMany(
      { course: { $in: publishedCourseIds } },
      { $set: { isPublished: true } }
    );
    
    console.log(`✅ Force updated ${assignmentUpdateResult.modifiedCount} assignments`);

    // 5. Verify by checking each course individually
    console.log('\n🔍 VERIFICATION - Checking each course:');
    console.log('-' .repeat(50));
    
    for (const course of publishedCourses) {
      const courseLessons = await Lesson.find({
        course: course._id,
        isPublished: true
      }).select('title order').sort({ order: 1 }).lean();
      
      console.log(`${course.title} (${course._id})`);
      console.log(`  Published lessons: ${courseLessons.length}`);
      
      if (courseLessons.length > 0) {
        courseLessons.slice(0, 3).forEach((lesson, index) => {
          console.log(`    ${index + 1}. ${lesson.title} (order: ${lesson.order})`);
        });
        if (courseLessons.length > 3) {
          console.log(`    ... and ${courseLessons.length - 3} more`);
        }
      }
      console.log('');
    }

    // 6. Test the API endpoint for a few courses
    console.log('\n🎯 TESTING API SIMULATION:');
    console.log('-' .repeat(50));
    
    const testCourseIds = [
      '684a30786e5709e50d55340f', // Complete Web Development Bootcamp
      '68490cb8e1e8cfec2ab0a546', // React.js từ cơ bản đến nâng cao
      '68490cb8e1e8cfec2ab0a54b'  // Node.js và Express.js Backend Development
    ];
    
    for (const courseId of testCourseIds) {
      const course = await Course.findById(courseId).select('title').lean();
      const lessons = await Lesson.find({ 
        course: courseId, 
        isPublished: true 
      })
      .select('title description content videoUrl videoThumbnail videoDuration videoSize videoFormat order duration isPreview resources')
      .sort({ order: 1 })
      .lean();
      
      console.log(`${course?.title || 'Unknown Course'} (${courseId})`);
      console.log(`  API would return: ${lessons.length} lessons`);
      
      if (lessons.length > 0) {
        console.log(`  First lesson: ${lessons[0].title}`);
        console.log(`  Last lesson: ${lessons[lessons.length - 1].title}`);
      }
      console.log('');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('\n🎉 Force publishing completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the learning page with different course IDs');
    console.log('2. Verify that lessons are now showing up');
    console.log('3. Check that the API endpoints are working correctly');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the force publishing
forcePublishAllLessons();
