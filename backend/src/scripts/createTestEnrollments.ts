import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';
import Order from '../models/Order';
import User from '../models/User';

async function createTestEnrollments() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🎓 CREATING TEST ENROLLMENTS FOR ALL STUDENTS');
    console.log('=' .repeat(80));

    // Get all students
    const students = await User.find({ role: 'student' }).select('_id email name').lean();
    console.log(`👥 Found ${students.length} students`);

    // Get all published courses
    const publishedCourses = await Course.find({
      isPublished: true,
      status: 'published'
    }).select('_id title price').lean();
    console.log(`📚 Found ${publishedCourses.length} published courses`);

    let enrollmentsCreated = 0;
    let enrollmentsExisted = 0;

    // Create enrollments for each student in each course
    for (const student of students) {
      console.log(`\n👤 Processing student: ${student.email}`);
      
      for (const course of publishedCourses) {
        // Check if enrollment already exists
        const existingEnrollment = await Order.findOne({
          user: student._id,
          'courses.course': course._id,
          status: 'completed',
          paymentStatus: 'paid'
        });

        if (!existingEnrollment) {
          // Get course details for the order
          const courseDetails = await Course.findById(course._id)
            .populate('instructor', 'name')
            .select('title instructor thumbnail')
            .lean();

          if (!courseDetails) {
            console.log(`  ❌ Course details not found for: ${course.title}`);
            continue;
          }

          // Create enrollment with all required fields
          const testOrder = new Order({
            user: student._id,
            courses: [{
              course: course._id,
              title: courseDetails.title,
              price: 0, // Free for testing
              originalPrice: course.price || 0,
              discountAmount: course.price || 0,
              instructor: (courseDetails.instructor as any)?.name || 'Test Instructor',
              thumbnail: courseDetails.thumbnail || ''
            }],
            subtotal: 0,
            discountAmount: course.price || 0,
            taxAmount: 0,
            totalAmount: 0,
            finalAmount: 0,
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod: 'cash', // Use valid payment method
            orderNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            completedAt: new Date()
          });

          await testOrder.save();
          enrollmentsCreated++;
          console.log(`  ✅ Enrolled in: ${course.title}`);
        } else {
          enrollmentsExisted++;
          console.log(`  ⏭️  Already enrolled in: ${course.title}`);
        }
      }
    }

    console.log('\n📊 ENROLLMENT SUMMARY:');
    console.log('-' .repeat(50));
    console.log(`✅ New enrollments created: ${enrollmentsCreated}`);
    console.log(`⏭️  Existing enrollments: ${enrollmentsExisted}`);
    console.log(`👥 Students processed: ${students.length}`);
    console.log(`📚 Courses processed: ${publishedCourses.length}`);

    // Verify enrollments
    console.log('\n🔍 VERIFICATION:');
    console.log('-' .repeat(50));
    
    for (const student of students.slice(0, 2)) { // Check first 2 students
      const studentEnrollments = await Order.find({
        user: student._id,
        status: 'completed',
        paymentStatus: 'paid'
      }).populate('courses.course', 'title').lean();

      const enrolledCourses = studentEnrollments.flatMap(order => 
        order.courses.map(c => c.course)
      );

      console.log(`${student.email}: ${enrolledCourses.length} enrollments`);
      enrolledCourses.slice(0, 3).forEach((course: any) => {
        console.log(`  - ${course.title}`);
      });
      if (enrolledCourses.length > 3) {
        console.log(`  ... and ${enrolledCourses.length - 3} more`);
      }
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n🎉 Test enrollments created successfully!');
    console.log('\n📋 Now you can test the learning page with any course ID');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the enrollment creation
createTestEnrollments();
