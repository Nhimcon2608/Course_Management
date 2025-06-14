import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import User from '../models/User';
import Course from '../models/Course';
import Category from '../models/Category';
import Order from '../models/Order';
import Progress from '../models/Progress';

async function testDashboardAPI() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get test user
    const testUser = await User.findOne({ email: 'nguyenvanan@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`🔍 Testing dashboard API for user: ${testUser.email} (${testUser._id})`);

    // Test 1: Dashboard enrolled courses query
    console.log('\n📊 Testing Dashboard Enrolled Courses Query:');
    const enrolledCourses = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(testUser._id),
          paymentStatus: 'paid',
          status: 'completed'
        }
      },
      { $unwind: '$courses' },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'progresses',
          let: { courseId: '$courses.course', userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$user', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'progress'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'courseDetails.instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $project: {
          _id: '$courseDetails._id',
          title: '$courseDetails.title',
          slug: '$courseDetails.slug',
          thumbnail: '$courseDetails.thumbnail',
          instructor: { $arrayElemAt: ['$instructor.name', 0] },
          level: '$courseDetails.level',
          duration: '$courseDetails.duration',
          totalLessons: { $size: '$courseDetails.lessons' },
          enrolledAt: '$createdAt',
          progress: {
            $cond: {
              if: { $gt: [{ $size: '$progress' }, 0] },
              then: { $arrayElemAt: ['$progress', 0] },
              else: {
                progressPercentage: 0,
                status: 'not_started',
                lastAccessedAt: '$createdAt',
                completedLessons: [],
                totalWatchTime: 0
              }
            }
          }
        }
      },
      { $sort: { 'progress.lastAccessedAt': -1 } },
      { $limit: 10 }
    ]);

    console.log(`✅ Dashboard query returned ${enrolledCourses.length} courses:`);
    enrolledCourses.forEach(course => {
      console.log(`  - ${course.title} (${course._id})`);
      console.log(`    Instructor: ${course.instructor}`);
      console.log(`    Progress: ${course.progress.progressPercentage}%`);
    });

    // Test 2: Learning courses query
    console.log('\n📚 Testing Learning Courses Query:');
    const orders = await Order.find({
      user: testUser._id,
      status: 'completed',
      paymentStatus: 'paid'
    }).select('courses').lean();

    const enrolledCourseIds = orders.flatMap(order =>
      order.courses.map(item => item.course.toString())
    );

    console.log(`📦 Found ${orders.length} completed orders`);
    console.log(`📚 Enrolled course IDs: ${enrolledCourseIds.join(', ')}`);

    if (enrolledCourseIds.length > 0) {
      const courses = await Course.find({
        _id: { $in: enrolledCourseIds },
        isPublished: true,
        status: 'published'
      })
        .select('title slug thumbnail price originalPrice rating studentsCount duration level category instructor')
        .lean();

      console.log(`✅ Learning query returned ${courses.length} courses:`);
      courses.forEach(course => {
        console.log(`  - ${course.title} (${course._id})`);
        console.log(`    Category ID: ${course.category}`);
        console.log(`    Instructor ID: ${course.instructor}`);
      });

      // Get progress for each course
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const progress = await Progress.findOne({
            user: testUser._id,
            course: course._id
          }).lean();

          return {
            ...course,
            progress: progress || {
              progressPercentage: 0,
              status: 'not_started',
              totalWatchTime: 0,
              completedLessons: [],
              lastAccessedAt: null
            }
          };
        })
      );

      console.log('\n📊 Courses with progress:');
      coursesWithProgress.forEach(course => {
        console.log(`  - ${course.title}: ${course.progress.progressPercentage}% (${course.progress.status})`);
      });
    }

    // Test 3: Dashboard stats query
    console.log('\n📈 Testing Dashboard Stats Query:');
    const statsOrders = await Order.find({
      user: testUser._id,
      status: 'completed',
      paymentStatus: 'paid'
    }).select('courses finalAmount').lean();

    const totalEnrolled = statsOrders.flatMap(order => order.courses).length;
    const totalSpent = statsOrders.reduce((sum, order) => sum + order.finalAmount, 0);

    console.log(`📊 Stats for user ${testUser.email}:`);
    console.log(`  - Total enrolled courses: ${totalEnrolled}`);
    console.log(`  - Total spent: ${totalSpent.toLocaleString('vi-VN')} VND`);

    // Test 4: Generate JWT token for testing
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    console.log('\n🔑 JWT Token for testing:');
    console.log(`Bearer ${token}`);
    console.log('\n📝 You can use this token to test API endpoints manually:');
    console.log('curl -H "Authorization: Bearer <token>" http://localhost:5000/api/dashboard/enrolled-courses');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDashboardAPI();
