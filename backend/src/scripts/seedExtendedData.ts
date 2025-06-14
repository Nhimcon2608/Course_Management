import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '@/config/database';
import User from '@/models/User';
import Course from '@/models/Course';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Progress from '@/models/Progress';
import Review from '@/models/Review';

// Load environment variables
dotenv.config();

async function seedExtendedData() {
  try {
    console.log('🌱 Starting extended data seeding...');
    
    // Connect to database
    await connectDB();
    
    // Get existing data
    const users = await User.find({ role: 'student' });
    const courses = await Course.find({ isPublished: true });
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (users.length === 0 || courses.length === 0) {
      console.log('❌ Please run basic seed first: npm run seed');
      process.exit(1);
    }
    
    console.log('📝 Creating sample reviews...');
    
    // Create sample reviews
    const sampleReviews = [
      {
        user: users[0]._id,
        course: courses[0]._id,
        rating: 5,
        title: 'Khóa học tuyệt vời!',
        comment: 'Khóa học rất chi tiết và dễ hiểu. Giảng viên giải thích rất rõ ràng và có nhiều ví dụ thực tế.',
        pros: ['Nội dung chi tiết', 'Giảng viên nhiệt tình', 'Có dự án thực tế'],
        cons: ['Hơi dài', 'Cần thêm bài tập'],
        status: 'approved'
      },
      {
        user: users[1]._id,
        course: courses[0]._id,
        rating: 4,
        title: 'Khóa học hay nhưng cần cải thiện',
        comment: 'Nội dung tốt nhưng cần thêm bài tập thực hành.',
        pros: ['Kiến thức cập nhật', 'Dễ theo dõi'],
        cons: ['Thiếu bài tập', 'Video hơi nhanh'],
        status: 'approved'
      },
      {
        user: users[2]._id,
        course: courses[1]._id,
        rating: 5,
        title: 'Xuất sắc cho người mới bắt đầu',
        comment: 'Khóa học phù hợp cho người mới bắt đầu. Từng bước một rất dễ hiểu.',
        pros: ['Phù hợp người mới', 'Có support tốt', 'Giá hợp lý'],
        cons: [],
        status: 'approved'
      },
      {
        user: users[3]._id,
        course: courses[2]._id,
        rating: 4,
        title: 'Thiết kế UI/UX chuyên nghiệp',
        comment: 'Học được nhiều kỹ thuật thiết kế mới. Figma được hướng dẫn rất chi tiết.',
        pros: ['Công cụ hiện đại', 'Thực hành nhiều', 'Có template'],
        cons: ['Cần máy tính mạnh'],
        status: 'approved'
      }
    ];
    
    // Clear existing reviews
    await Review.deleteMany({});
    
    const createdReviews = [];
    for (const reviewData of sampleReviews) {
      const review = new Review(reviewData);
      await review.save();
      createdReviews.push(review);
    }
    
    console.log(`✅ Created ${createdReviews.length} reviews`);
    
    // Create sample orders
    console.log('🛒 Creating sample orders...');
    
    const sampleOrders = [
      {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        user: users[0]._id,
        courses: [
          {
            course: courses[0]._id,
            title: courses[0].title,
            price: courses[0].price,
            originalPrice: courses[0].originalPrice,
            instructor: adminUser?.name || 'Admin',
            thumbnail: courses[0].thumbnail
          }
        ],
        subtotal: courses[0].price,
        totalAmount: courses[0].price,
        finalAmount: courses[0].price,
        status: 'completed',
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        orderNumber: `ORD-${Date.now() + 1000}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        user: users[1]._id,
        courses: [
          {
            course: courses[1]._id,
            title: courses[1].title,
            price: courses[1].price,
            originalPrice: courses[1].originalPrice,
            instructor: adminUser?.name || 'Admin',
            thumbnail: courses[1].thumbnail
          },
          {
            course: courses[2]._id,
            title: courses[2].title,
            price: courses[2].price,
            originalPrice: courses[2].originalPrice,
            instructor: adminUser?.name || 'Admin',
            thumbnail: courses[2].thumbnail
          }
        ],
        subtotal: courses[1].price + courses[2].price,
        totalAmount: courses[1].price + courses[2].price,
        finalAmount: courses[1].price + courses[2].price,
        status: 'completed',
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];
    
    // Clear existing orders
    await Order.deleteMany({});
    
    const createdOrders = [];
    for (const orderData of sampleOrders) {
      const order = new Order(orderData);
      await order.save();
      createdOrders.push(order);
    }
    
    console.log(`✅ Created ${createdOrders.length} orders`);
    
    // Create sample progress
    console.log('📈 Creating sample progress...');
    
    const sampleProgress = [
      {
        user: users[0]._id,
        course: courses[0]._id,
        enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        progressPercentage: 75,
        completedLessons: [courses[0].lessons[0]._id, courses[0].lessons[1]._id],
        lessonsProgress: [
          {
            lesson: courses[0].lessons[0]._id,
            completed: true,
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            watchTime: 45,
            totalTime: 45,
            lastWatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: courses[0].lessons[1]._id,
            completed: true,
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            watchTime: 60,
            totalTime: 60,
            lastWatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: courses[0].lessons[2]._id,
            completed: false,
            watchTime: 30,
            totalTime: 75,
            lastWatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        currentLesson: courses[0].lessons[2]._id,
        totalWatchTime: 135,
        status: 'in_progress'
      },
      {
        user: users[1]._id,
        course: courses[1]._id,
        enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        progressPercentage: 100,
        completedLessons: [courses[1].lessons[0]._id, courses[1].lessons[1]._id],
        lessonsProgress: [
          {
            lesson: courses[1].lessons[0]._id,
            completed: true,
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            watchTime: 40,
            totalTime: 40,
            lastWatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: courses[1].lessons[1]._id,
            completed: true,
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            watchTime: 55,
            totalTime: 55,
            lastWatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        totalWatchTime: 95,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        certificateIssued: true,
        certificateIssuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed'
      }
    ];
    
    // Clear existing progress
    await Progress.deleteMany({});
    
    const createdProgress = [];
    for (const progressData of sampleProgress) {
      const progress = new Progress(progressData);
      await progress.save();
      createdProgress.push(progress);
    }
    
    console.log(`✅ Created ${createdProgress.length} progress records`);
    
    // Create sample carts
    console.log('🛒 Creating sample carts...');
    
    const sampleCarts = [
      {
        user: users[2]._id,
        items: [
          {
            course: courses[3]._id,
            price: courses[3].price,
            originalPrice: courses[3].originalPrice,
            addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            course: courses[4]._id,
            price: courses[4].price,
            originalPrice: courses[4].originalPrice,
            addedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          }
        ]
      }
    ];
    
    // Clear existing carts
    await Cart.deleteMany({});
    
    const createdCarts = [];
    for (const cartData of sampleCarts) {
      const cart = new Cart(cartData);
      await cart.save();
      createdCarts.push(cart);
    }
    
    console.log(`✅ Created ${createdCarts.length} carts`);
    
    // Update course ratings based on reviews
    console.log('⭐ Updating course ratings...');
    for (const course of courses) {
      await course.calculateAverageRating();
    }
    
    console.log('🎉 Extended data seeding completed successfully!');
    console.log('\n📊 Extended Summary:');
    console.log(`📝 Reviews: ${createdReviews.length}`);
    console.log(`🛒 Orders: ${createdOrders.length}`);
    console.log(`📈 Progress: ${createdProgress.length}`);
    console.log(`🛒 Carts: ${createdCarts.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding extended data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedExtendedData();
}

export default seedExtendedData;
