import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Course from '../models/Course';
import Order from '../models/Order';
import Progress from '../models/Progress';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const createTestData = async () => {
  try {
    console.log('🌱 Creating test data...');
    
    await connectDB();

    // Get test user (any user with student role)
    let testUser = await User.findOne({ role: 'student' });
    if (!testUser) {
      // Try to find any user
      testUser = await User.findOne({});
      if (!testUser) {
        console.log('❌ No users found. Please run the seeding script first.');
        return;
      }
    }

    console.log(`👤 Using test user: ${testUser.email}`);

    // Get some courses with instructor populated
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name')
      .limit(3);
    if (courses.length === 0) {
      console.log('❌ No courses found. Please run the seeding script first.');
      return;
    }

    console.log(`📚 Found ${courses.length} courses`);

    // Create test orders
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      
      // Check if order already exists
      const existingOrder = await Order.findOne({
        user: testUser._id,
        'courses.course': course._id
      });

      if (existingOrder) {
        console.log(`⏭️  Order for course "${course.title}" already exists`);
        continue;
      }

      const order = new Order({
        user: testUser._id,
        orderNumber: `ORD-${Date.now()}-${i}`,
        courses: [{
          course: course._id,
          title: course.title,
          instructor: (course.instructor as any)?.name || 'Unknown Instructor',
          price: course.price,
          originalPrice: course.originalPrice || course.price
        }],
        subtotal: course.price,
        totalAmount: course.price,
        finalAmount: course.price,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'zalopay',
        paymentDetails: {
          transactionId: `test-${Date.now()}-${i}`,
          paymentDate: new Date()
        }
      });

      await order.save();
      console.log(`✅ Created order for course: ${course.title}`);

      // Create progress for this course
      const existingProgress = await Progress.findOne({
        user: testUser._id,
        course: course._id
      });

      if (!existingProgress) {
        const progressPercentage = Math.floor(Math.random() * 100);
        const status = progressPercentage === 100 ? 'completed' : 
                      progressPercentage > 0 ? 'in_progress' : 'not_started';
        
        const progress = new Progress({
          user: testUser._id,
          course: course._id,
          progressPercentage,
          status,
          completedLessons: course.lessons.slice(0, Math.floor(course.lessons.length * progressPercentage / 100)).map(l => l._id),
          totalWatchTime: Math.floor(Math.random() * 3600), // Random watch time in seconds
          lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        });

        await progress.save();
        console.log(`✅ Created progress for course: ${course.title} (${progressPercentage}%)`);
      } else {
        console.log(`⏭️  Progress for course "${course.title}" already exists`);
      }
    }

    console.log('🎉 Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createTestData();
}

export default createTestData;
