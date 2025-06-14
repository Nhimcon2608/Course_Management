import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';

async function verifyLessons() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all courses with lessons
    const courses = await Course.find({}).select('title slug lessons duration');
    console.log(`📚 Found ${courses.length} courses to verify\n`);

    for (const course of courses) {
      console.log(`📖 Course: "${course.title}"`);
      console.log(`   Slug: ${course.slug}`);
      console.log(`   Total lessons: ${course.lessons?.length || 0}`);
      console.log(`   Course duration: ${course.duration} hours`);
      
      if (course.lessons && course.lessons.length > 0) {
        const totalMinutes = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);
        const previewLessons = course.lessons.filter(lesson => lesson.isPreview);
        
        console.log(`   Total lesson duration: ${totalMinutes} minutes (${Math.round(totalMinutes/60*10)/10} hours)`);
        console.log(`   Preview lessons: ${previewLessons.length}`);
        
        console.log(`   Lessons:`);
        course.lessons.forEach((lesson, index) => {
          console.log(`     ${index + 1}. ${lesson.title} (${lesson.duration}min) ${lesson.isPreview ? '[PREVIEW]' : ''}`);
        });
      } else {
        console.log(`   ❌ No lessons found!`);
      }
      
      console.log(''); // Empty line for separation
    }

    console.log('🎉 Lesson verification completed!');

  } catch (error) {
    console.error('❌ Error verifying lessons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
if (require.main === module) {
  verifyLessons();
}

export default verifyLessons;
