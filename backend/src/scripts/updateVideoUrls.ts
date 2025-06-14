import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';

// Video URL mappings for specific courses and lessons
const videoUrlMappings = {
  'react-js': {
    courseIdentifiers: ['react.js từ cơ bản đến nâng cao', 'reactjs-tu-co-ban-en-nang-cao'],
    lessons: [
      {
        order: 1,
        title: 'Bài học 1: Giới thiệu về React.js',
        videoUrl: 'https://youtu.be/OR0t1Eot3Y8?si=-nn-rfjsdRd-0yFp'
      },
      {
        order: 2,
        title: 'Bài học 2: Cài đặt môi trường phát triển',
        videoUrl: 'https://youtu.be/4eC3igMpIwg?si=0EeXwPuap1nG0zpd'
      },
      {
        order: 3,
        title: 'Bài học 3: JSX và Components cơ bản',
        videoUrl: 'https://youtu.be/sNXMYDk3SoU?si=QYaWHc1C-oYqbAIl'
      },
      {
        order: 4,
        title: 'Bài học 4: Props và State',
        videoUrl: 'https://youtu.be/RMsBc2usXvs?si=YO5Jo_48mRY_w5a0'
      },
      {
        order: 5,
        title: 'Bài học 5: Event Handling',
        videoUrl: 'https://youtu.be/bJMp9vJE0E4?si=S449Pb2dMVNYFBAe'
      },
      {
        order: 6,
        title: 'Bài học 6: React Hooks - useState và useEffect',
        videoUrl: 'https://youtu.be/QRQvqpoP3NA?si=VATxIIIMrXV_tWuj'
      }
    ]
  },
  'digital-marketing': {
    courseIdentifiers: ['digital marketing từ zero đến hero', 'digital-marketing-tu-zero-en-hero'],
    lessons: [
      {
        order: 1,
        title: 'Bài học 1: Giới thiệu về Digital Marketing',
        videoUrl: 'https://youtu.be/93zSv9UjpAc?si=iJ_Q4kFf5jam07A7'
      },
      {
        order: 2,
        title: 'Bài học 2: Xây dựng chiến lược Marketing',
        videoUrl: 'https://youtu.be/CXB3ZNSxo_k?si=6EuVrBaI4M5qHshK'
      },
      {
        order: 3,
        title: 'Bài học 3: SEO cơ bản',
        videoUrl: 'https://youtu.be/c5oQKHUxhJQ?si=OTSMypX1TljXUBOa'
      },
      {
        order: 4,
        title: 'Bài học 4: Google Ads và PPC',
        videoUrl: 'https://youtu.be/1rIHG4sAPdM?si=st7mk3yAu_g8Ebhy'
      },
      {
        order: 5,
        title: 'Bài học 5: Social Media Marketing',
        videoUrl: 'https://youtu.be/qLOXhbE1nEo?si=sTal8INJu2ffDY4h'
      }
    ]
  }
};

// Function to identify course type based on title and slug
function identifyCourseType(course: any): string | null {
  const title = course.title.toLowerCase();
  const slug = course.slug.toLowerCase();
  
  for (const [courseType, config] of Object.entries(videoUrlMappings)) {
    for (const identifier of config.courseIdentifiers) {
      if (title.includes(identifier.toLowerCase()) || slug.includes(identifier.toLowerCase())) {
        return courseType;
      }
    }
  }
  
  return null;
}

// Function to update video URLs for a specific course
async function updateCourseVideoUrls(course: any, courseType: string): Promise<number> {
  const config = videoUrlMappings[courseType as keyof typeof videoUrlMappings];
  let updatedCount = 0;
  
  console.log(`\n🔄 Processing course: "${course.title}"`);
  console.log(`   Course type: ${courseType}`);
  console.log(`   Current lessons: ${course.lessons?.length || 0}`);
  
  if (!course.lessons || course.lessons.length === 0) {
    console.log(`   ⚠️  No lessons found in course`);
    return 0;
  }
  
  // Update video URLs for matching lessons
  for (const lessonUpdate of config.lessons) {
    // Find lesson by order
    const lessonIndex = course.lessons.findIndex((lesson: any) => lesson.order === lessonUpdate.order);
    
    if (lessonIndex !== -1) {
      const lesson = course.lessons[lessonIndex];
      const oldVideoUrl = lesson.videoUrl;
      
      // Update video URL
      lesson.videoUrl = lessonUpdate.videoUrl;
      
      console.log(`   ✅ Updated lesson ${lessonUpdate.order}: "${lesson.title}"`);
      console.log(`      Old URL: ${oldVideoUrl}`);
      console.log(`      New URL: ${lessonUpdate.videoUrl}`);
      
      updatedCount++;
    } else {
      console.log(`   ⚠️  Lesson with order ${lessonUpdate.order} not found`);
    }
  }
  
  // Save the course with updated lessons
  if (updatedCount > 0) {
    await course.save();
    console.log(`   💾 Saved course with ${updatedCount} updated lessons`);
  }
  
  return updatedCount;
}

async function updateVideoUrls() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all courses
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses to check for video URL updates`);

    let totalCoursesUpdated = 0;
    let totalLessonsUpdated = 0;

    for (const course of courses) {
      // Identify course type
      const courseType = identifyCourseType(course);
      
      if (courseType) {
        const updatedLessons = await updateCourseVideoUrls(course, courseType);
        if (updatedLessons > 0) {
          totalCoursesUpdated++;
          totalLessonsUpdated += updatedLessons;
        }
      } else {
        console.log(`\n⏭️  Skipping "${course.title}" - not in update list`);
      }
    }

    console.log('\n🎉 Video URL update completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Courses updated: ${totalCoursesUpdated}`);
    console.log(`   - Lessons updated: ${totalLessonsUpdated}`);
    console.log(`   - Total courses checked: ${courses.length}`);

  } catch (error) {
    console.error('❌ Error updating video URLs:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
if (require.main === module) {
  updateVideoUrls().catch(console.error);
}

export default updateVideoUrls;
