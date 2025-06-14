import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Assignment from '../models/Assignment';

async function checkLessonsData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 CHECKING LESSONS DATA ACROSS COLLECTIONS');
    console.log('=' .repeat(80));

    // 1. Check courses collection
    console.log('\n📚 1. COURSES COLLECTION:');
    console.log('-' .repeat(50));
    
    const courses = await Course.find({}).select('_id title lessons isPublished status').lean();
    console.log(`Total courses: ${courses.length}`);
    
    let coursesWithEmbeddedLessons = 0;
    let totalEmbeddedLessons = 0;
    
    for (const course of courses) {
      const embeddedLessonsCount = course.lessons?.length || 0;
      if (embeddedLessonsCount > 0) {
        coursesWithEmbeddedLessons++;
        totalEmbeddedLessons += embeddedLessonsCount;
      }
      
      console.log(`${course.title}`);
      console.log(`  ID: ${course._id}`);
      console.log(`  Embedded lessons: ${embeddedLessonsCount}`);
      console.log(`  Published: ${course.isPublished}, Status: ${course.status}`);
      console.log('');
    }
    
    console.log(`📊 Summary - Courses Collection:`);
    console.log(`  - Courses with embedded lessons: ${coursesWithEmbeddedLessons}/${courses.length}`);
    console.log(`  - Total embedded lessons: ${totalEmbeddedLessons}`);

    // 2. Check lessons collection
    console.log('\n📖 2. LESSONS COLLECTION:');
    console.log('-' .repeat(50));
    
    const lessons = await Lesson.find({}).select('_id title course isPublished order').populate('course', 'title').lean();
    console.log(`Total lessons in separate collection: ${lessons.length}`);
    
    // Group lessons by course
    const lessonsByCourse = lessons.reduce((acc: any, lesson: any) => {
      const courseId = lesson.course._id.toString();
      if (!acc[courseId]) {
        acc[courseId] = {
          courseTitle: lesson.course.title,
          lessons: []
        };
      }
      acc[courseId].lessons.push(lesson);
      return acc;
    }, {});
    
    console.log(`Courses with lessons in separate collection: ${Object.keys(lessonsByCourse).length}`);
    
    for (const [courseId, data] of Object.entries(lessonsByCourse) as any) {
      console.log(`${data.courseTitle} (${courseId})`);
      console.log(`  Lessons in separate collection: ${data.lessons.length}`);
      console.log(`  Published lessons: ${data.lessons.filter((l: any) => l.isPublished).length}`);
      console.log('');
    }

    // 3. Check assignments collection
    console.log('\n📝 3. ASSIGNMENTS COLLECTION:');
    console.log('-' .repeat(50));
    
    const assignments = await Assignment.find({}).select('_id title course lesson isPublished').populate('course', 'title').lean();
    console.log(`Total assignments in separate collection: ${assignments.length}`);

    // 4. Compare and identify missing data
    console.log('\n🔍 4. DATA COMPARISON:');
    console.log('-' .repeat(50));
    
    const coursesNeedingMigration = [];
    
    for (const course of courses) {
      const courseId = course._id.toString();
      const embeddedLessonsCount = course.lessons?.length || 0;
      const separateLessonsCount = lessonsByCourse[courseId]?.lessons.length || 0;
      
      if (embeddedLessonsCount > 0 && separateLessonsCount === 0) {
        coursesNeedingMigration.push({
          id: courseId,
          title: course.title,
          embeddedLessons: embeddedLessonsCount,
          isPublished: course.isPublished,
          status: course.status
        });
      }
    }
    
    console.log(`📋 Courses needing migration: ${coursesNeedingMigration.length}`);
    
    if (coursesNeedingMigration.length > 0) {
      console.log('\nCourses that need lesson migration:');
      coursesNeedingMigration.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   Embedded lessons: ${course.embeddedLessons}`);
        console.log(`   Published: ${course.isPublished}, Status: ${course.status}`);
        console.log('');
      });
    }

    // 5. Test specific course ID
    console.log('\n🎯 5. TESTING SPECIFIC COURSE (684a30786e5709e50d55340f):');
    console.log('-' .repeat(50));
    
    const testCourseId = '684a30786e5709e50d55340f';
    const testCourse = await Course.findById(testCourseId).select('title lessons isPublished status').lean();
    const testLessons = await Lesson.find({ course: testCourseId, isPublished: true }).lean();
    
    if (testCourse) {
      console.log(`Course: ${testCourse.title}`);
      console.log(`Embedded lessons: ${testCourse.lessons?.length || 0}`);
      console.log(`Separate lessons: ${testLessons.length}`);
      console.log(`Published: ${testCourse.isPublished}, Status: ${testCourse.status}`);
    } else {
      console.log('❌ Test course not found');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the check
checkLessonsData();
