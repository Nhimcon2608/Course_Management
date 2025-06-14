import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';

// Expected video URLs for verification
const expectedVideoUrls = {
  'react-js': {
    courseIdentifiers: ['react.js từ cơ bản đến nâng cao', 'reactjs-tu-co-ban-en-nang-cao'],
    lessons: [
      {
        order: 1,
        title: 'Bài học 1: Giới thiệu về React.js',
        expectedUrl: 'https://youtu.be/OR0t1Eot3Y8?si=-nn-rfjsdRd-0yFp'
      },
      {
        order: 2,
        title: 'Bài học 2: Cài đặt môi trường phát triển',
        expectedUrl: 'https://youtu.be/4eC3igMpIwg?si=0EeXwPuap1nG0zpd'
      },
      {
        order: 3,
        title: 'Bài học 3: JSX và Components cơ bản',
        expectedUrl: 'https://youtu.be/sNXMYDk3SoU?si=QYaWHc1C-oYqbAIl'
      },
      {
        order: 4,
        title: 'Bài học 4: Props và State',
        expectedUrl: 'https://youtu.be/RMsBc2usXvs?si=YO5Jo_48mRY_w5a0'
      },
      {
        order: 5,
        title: 'Bài học 5: Event Handling',
        expectedUrl: 'https://youtu.be/bJMp9vJE0E4?si=S449Pb2dMVNYFBAe'
      },
      {
        order: 6,
        title: 'Bài học 6: React Hooks - useState và useEffect',
        expectedUrl: 'https://youtu.be/QRQvqpoP3NA?si=VATxIIIMrXV_tWuj'
      }
    ]
  },
  'digital-marketing': {
    courseIdentifiers: ['digital marketing từ zero đến hero', 'digital-marketing-tu-zero-en-hero'],
    lessons: [
      {
        order: 1,
        title: 'Bài học 1: Giới thiệu về Digital Marketing',
        expectedUrl: 'https://youtu.be/93zSv9UjpAc?si=iJ_Q4kFf5jam07A7'
      },
      {
        order: 2,
        title: 'Bài học 2: Xây dựng chiến lược Marketing',
        expectedUrl: 'https://youtu.be/CXB3ZNSxo_k?si=6EuVrBaI4M5qHshK'
      },
      {
        order: 3,
        title: 'Bài học 3: SEO cơ bản',
        expectedUrl: 'https://youtu.be/c5oQKHUxhJQ?si=OTSMypX1TljXUBOa'
      },
      {
        order: 4,
        title: 'Bài học 4: Google Ads và PPC',
        expectedUrl: 'https://youtu.be/1rIHG4sAPdM?si=st7mk3yAu_g8Ebhy'
      },
      {
        order: 5,
        title: 'Bài học 5: Social Media Marketing',
        expectedUrl: 'https://youtu.be/qLOXhbE1nEo?si=sTal8INJu2ffDY4h'
      }
    ]
  }
};

// Function to identify course type based on title and slug
function identifyCourseType(course: any): string | null {
  const title = course.title.toLowerCase();
  const slug = course.slug.toLowerCase();
  
  for (const [courseType, config] of Object.entries(expectedVideoUrls)) {
    for (const identifier of config.courseIdentifiers) {
      if (title.includes(identifier.toLowerCase()) || slug.includes(identifier.toLowerCase())) {
        return courseType;
      }
    }
  }
  
  return null;
}

// Function to verify video URLs for a specific course
function verifyCourseVideoUrls(course: any, courseType: string): { verified: number; failed: number; details: any[] } {
  const config = expectedVideoUrls[courseType as keyof typeof expectedVideoUrls];
  let verifiedCount = 0;
  let failedCount = 0;
  const details: any[] = [];
  
  console.log(`\n🔍 Verifying course: "${course.title}"`);
  console.log(`   Course type: ${courseType}`);
  console.log(`   Total lessons: ${course.lessons?.length || 0}`);
  
  if (!course.lessons || course.lessons.length === 0) {
    console.log(`   ⚠️  No lessons found in course`);
    return { verified: 0, failed: 0, details: [] };
  }
  
  // Verify video URLs for expected lessons
  for (const expectedLesson of config.lessons) {
    // Find lesson by order
    const lesson = course.lessons.find((l: any) => l.order === expectedLesson.order);
    
    if (lesson) {
      const isCorrect = lesson.videoUrl === expectedLesson.expectedUrl;
      
      if (isCorrect) {
        console.log(`   ✅ Lesson ${expectedLesson.order}: "${lesson.title}" - URL correct`);
        verifiedCount++;
      } else {
        console.log(`   ❌ Lesson ${expectedLesson.order}: "${lesson.title}" - URL mismatch`);
        console.log(`      Expected: ${expectedLesson.expectedUrl}`);
        console.log(`      Actual:   ${lesson.videoUrl}`);
        failedCount++;
      }
      
      details.push({
        order: expectedLesson.order,
        title: lesson.title,
        expectedUrl: expectedLesson.expectedUrl,
        actualUrl: lesson.videoUrl,
        isCorrect
      });
    } else {
      console.log(`   ❌ Lesson with order ${expectedLesson.order} not found`);
      failedCount++;
      details.push({
        order: expectedLesson.order,
        title: expectedLesson.title,
        expectedUrl: expectedLesson.expectedUrl,
        actualUrl: null,
        isCorrect: false
      });
    }
  }
  
  return { verified: verifiedCount, failed: failedCount, details };
}

async function verifyVideoUrls() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all courses
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses to verify video URLs`);

    let totalCoursesChecked = 0;
    let totalLessonsVerified = 0;
    let totalLessonsFailed = 0;
    const verificationResults: any[] = [];

    for (const course of courses) {
      // Identify course type
      const courseType = identifyCourseType(course);
      
      if (courseType) {
        const result = verifyCourseVideoUrls(course, courseType);
        totalCoursesChecked++;
        totalLessonsVerified += result.verified;
        totalLessonsFailed += result.failed;
        
        verificationResults.push({
          courseTitle: course.title,
          courseType,
          verified: result.verified,
          failed: result.failed,
          details: result.details
        });
      } else {
        console.log(`\n⏭️  Skipping "${course.title}" - not in verification list`);
      }
    }

    console.log('\n🎉 Video URL verification completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Courses checked: ${totalCoursesChecked}`);
    console.log(`   - Lessons verified: ${totalLessonsVerified}`);
    console.log(`   - Lessons failed: ${totalLessonsFailed}`);
    console.log(`   - Success rate: ${totalLessonsVerified + totalLessonsFailed > 0 ? Math.round((totalLessonsVerified / (totalLessonsVerified + totalLessonsFailed)) * 100) : 0}%`);

    // Show detailed results
    if (verificationResults.length > 0) {
      console.log('\n📋 Detailed Results:');
      for (const result of verificationResults) {
        console.log(`\n📖 ${result.courseTitle}:`);
        console.log(`   ✅ Verified: ${result.verified}`);
        console.log(`   ❌ Failed: ${result.failed}`);
        
        if (result.failed > 0) {
          console.log(`   Failed lessons:`);
          result.details.filter((d: any) => !d.isCorrect).forEach((detail: any) => {
            console.log(`     - Lesson ${detail.order}: ${detail.title}`);
          });
        }
      }
    }

    // Return verification status
    return totalLessonsFailed === 0;

  } catch (error) {
    console.error('❌ Error verifying video URLs:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
if (require.main === module) {
  verifyVideoUrls()
    .then((success) => {
      if (success) {
        console.log('\n🎉 All video URLs verified successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Some video URLs failed verification!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export default verifyVideoUrls;
