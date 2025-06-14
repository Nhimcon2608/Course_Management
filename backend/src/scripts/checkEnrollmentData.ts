import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import User from '../models/User';
import Course from '../models/Course';
import Order from '../models/Order';
import Progress from '../models/Progress';

async function checkEnrollmentData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users: ${userCount}`);

    // Check courses
    const courseCount = await Course.countDocuments();
    console.log(`📚 Total courses: ${courseCount}`);

    // Check orders
    const orderCount = await Order.countDocuments();
    console.log(`📦 Total orders: ${orderCount}`);

    // Check completed orders
    const completedOrders = await Order.find({
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('user', 'name email').lean();
    
    console.log(`✅ Completed orders: ${completedOrders.length}`);
    
    if (completedOrders.length > 0) {
      console.log('\n📋 Completed Orders Details:');
      for (const order of completedOrders) {
        console.log(`- Order ${order.orderNumber}: User ${(order.user as any).email}, ${order.courses.length} courses`);
        for (const courseItem of order.courses) {
          console.log(`  * Course: ${courseItem.title} (${courseItem.course})`);
        }
      }
    }

    // Check progress records
    const progressCount = await Progress.countDocuments();
    console.log(`\n📊 Total progress records: ${progressCount}`);

    // Check specific user enrollment
    const testUser = await User.findOne({ email: 'nguyenvanan@gmail.com' });
    if (testUser) {
      console.log(`\n🔍 Checking enrollment for user: ${testUser.email}`);
      
      // Check user's orders
      const userOrders = await Order.find({
        user: testUser._id,
        status: 'completed',
        paymentStatus: 'paid'
      }).lean();
      
      console.log(`📦 User's completed orders: ${userOrders.length}`);
      
      if (userOrders.length > 0) {
        const enrolledCourseIds = userOrders.flatMap(order =>
          order.courses.map(item => item.course.toString())
        );
        
        console.log(`📚 Enrolled course IDs: ${enrolledCourseIds.join(', ')}`);
        
        // Get course details
        const enrolledCourses = await Course.find({
          _id: { $in: enrolledCourseIds }
        }).select('title slug').lean();
        
        console.log('📖 Enrolled courses:');
        enrolledCourses.forEach(course => {
          console.log(`  - ${course.title} (${course._id})`);
        });
        
        // Check progress for these courses
        const userProgress = await Progress.find({
          user: testUser._id,
          course: { $in: enrolledCourseIds }
        }).lean();
        
        console.log(`📊 Progress records for user: ${userProgress.length}`);
      }
    }

    // Test dashboard API query
    console.log('\n🔍 Testing Dashboard API Query:');
    const dashboardQuery = await Order.aggregate([
      {
        $match: {
          user: testUser ? new mongoose.Types.ObjectId(testUser._id) : new mongoose.Types.ObjectId(),
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
        $project: {
          _id: '$courseDetails._id',
          title: '$courseDetails.title',
          slug: '$courseDetails.slug',
          thumbnail: '$courseDetails.thumbnail',
          level: '$courseDetails.level',
          duration: '$courseDetails.duration',
          enrolledAt: '$createdAt'
        }
      },
      { $limit: 10 }
    ]);
    
    console.log(`📊 Dashboard query result: ${dashboardQuery.length} courses`);
    dashboardQuery.forEach(course => {
      console.log(`  - ${course.title} (${course._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkEnrollmentData();
