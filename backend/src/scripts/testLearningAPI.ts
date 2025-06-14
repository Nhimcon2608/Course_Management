import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Assignment from '../models/Assignment';
import Order from '../models/Order';
import User from '../models/User';

async function testLearningAPI() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 TESTING LEARNING API LOGIC');
    console.log('=' .repeat(80));

    // Test course IDs
    const testCourseIds = [
      '684a30786e5709e50d55340f', // Complete Web Development Bootcamp
      '68490cb8e1e8cfec2ab0a546', // React.js từ cơ bản đến nâng cao
      '68490cb8e1e8cfec2ab0a54b', // Node.js và Express.js Backend Development
      '68490cb8e1e8cfec2ab0a54f'  // UI/UX Design với Figma từ A-Z
    ];

    // Get a test user (student)
    const testUser = await User.findOne({ role: 'student' }).lean();
    if (!testUser) {
      console.log('❌ No student user found for testing');
      return;
    }
    console.log(`🧑‍🎓 Using test user: ${testUser.email} (${testUser._id})`);

    // Test each course
    for (const courseId of testCourseIds) {
      console.log(`\n📚 Testing Course: ${courseId}`);
      console.log('-' .repeat(50));

      // 1. Check if course exists and is published
      const course = await Course.findOne({
        _id: courseId,
        isPublished: true,
        status: 'published'
      }).select('title').lean();

      if (!course) {
        console.log('❌ Course not found or not published');
        continue;
      }
      console.log(`✅ Course found: ${course.title}`);

      // 2. Check enrollment (simulate API logic)
      const enrollment = await Order.findOne({
        user: testUser._id,
        'courses.course': courseId,
        status: 'completed',
        paymentStatus: 'paid'
      });

      console.log(`📝 Enrollment status: ${enrollment ? 'ENROLLED' : 'NOT ENROLLED'}`);

      // 3. Get lessons (simulate API response)
      const lessons = await Lesson.find({ 
        course: courseId, 
        isPublished: true 
      })
        .select('title description content videoUrl videoThumbnail videoDuration videoSize videoFormat order duration isPreview resources')
        .sort({ order: 1 })
        .lean();

      console.log(`📖 Published lessons found: ${lessons.length}`);
      
      if (lessons.length > 0) {
        console.log('   Lessons:');
        lessons.slice(0, 3).forEach((lesson, index) => {
          console.log(`   ${index + 1}. ${lesson.title} (order: ${lesson.order}, duration: ${lesson.duration}min)`);
        });
        if (lessons.length > 3) {
          console.log(`   ... and ${lessons.length - 3} more lessons`);
        }
      }

      // 4. Get assignments (simulate API response)
      const assignments = await Assignment.find({ 
        course: courseId, 
        isPublished: true 
      })
        .populate('lesson', 'title order')
        .select('title description instructions questions totalPoints passingScore timeLimit attempts deadline lesson')
        .sort({ 'lesson.order': 1 })
        .lean();

      console.log(`📝 Published assignments found: ${assignments.length}`);

      // 5. Simulate API response
      const apiResponse = {
        success: true,
        message: 'Lessons retrieved successfully',
        data: {
          lessons,
          total: lessons.length
        }
      };

      console.log(`🔄 API Response: ${apiResponse.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Would return ${apiResponse.data.total} lessons to frontend`);
    }

    // Test enrollment creation for one course
    console.log('\n🎯 CREATING TEST ENROLLMENT:');
    console.log('-' .repeat(50));
    
    const testCourseId = '68490cb8e1e8cfec2ab0a546'; // React.js course
    
    // Check if enrollment already exists
    const existingEnrollment = await Order.findOne({
      user: testUser._id,
      'courses.course': testCourseId,
      status: 'completed',
      paymentStatus: 'paid'
    });

    if (!existingEnrollment) {
      // Create a test enrollment
      const testOrder = new Order({
        user: testUser._id,
        courses: [{
          course: testCourseId,
          price: 0
        }],
        totalAmount: 0,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'free'
      });

      await testOrder.save();
      console.log(`✅ Created test enrollment for course ${testCourseId}`);
    } else {
      console.log(`✅ Test enrollment already exists for course ${testCourseId}`);
    }

    // Re-test the enrolled course
    console.log('\n🔄 RE-TESTING WITH ENROLLMENT:');
    console.log('-' .repeat(50));
    
    const enrollmentCheck = await Order.findOne({
      user: testUser._id,
      'courses.course': testCourseId,
      status: 'completed',
      paymentStatus: 'paid'
    });

    console.log(`📝 Enrollment verified: ${enrollmentCheck ? 'YES' : 'NO'}`);

    if (enrollmentCheck) {
      const lessons = await Lesson.find({ 
        course: testCourseId, 
        isPublished: true 
      })
        .select('title description content videoUrl videoThumbnail videoDuration videoSize videoFormat order duration isPreview resources')
        .sort({ order: 1 })
        .lean();

      console.log(`📖 Lessons available for enrolled user: ${lessons.length}`);
      console.log('✅ Learning page should now work for this course!');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the test
testLearningAPI();
