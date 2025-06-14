import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Category from '../models/Category';
import Course from '../models/Course';
import Review from '../models/Review';
import Progress from '../models/Progress';
import Cart from '../models/Cart';
import Order from '../models/Order';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course-management';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Course.deleteMany({});
    await Review.deleteMany({});
    await Progress.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️  Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('123456', 12);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@coursemanagement.com',
        password: await bcrypt.hash('123456', 12),
        role: 'admin',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      {
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@gmail.com',
        password: await bcrypt.hash('123456', 12),
        role: 'instructor',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Senior Full-stack Developer với 8+ năm kinh nghiệm. Chuyên gia về React, Node.js và MongoDB.',
        phone: '+84 901 234 567',
        address: '123 Nguyễn Huệ',
        city: 'Ho Chi Minh City',
        country: 'Vietnam',
        expertise: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript'],
        qualifications: ['Bachelor of Computer Science', 'AWS Certified Developer', 'Google Cloud Professional'],
        yearsOfExperience: 8,
        socialLinks: {
          website: 'https://nguyenvanan.dev',
          linkedin: 'https://linkedin.com/in/nguyenvanan',
          github: 'https://github.com/nguyenvanan'
        }
      },
      {
        name: 'Trần Thị Bình',
        email: 'tranthibinh@gmail.com',
        password: await bcrypt.hash('123456', 12),
        role: 'instructor',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        bio: 'UI/UX Designer và Frontend Developer. Đam mê tạo ra những trải nghiệm người dùng tuyệt vời.',
        phone: '+84 902 345 678',
        address: '456 Lê Lợi',
        city: 'Da Nang',
        country: 'Vietnam',
        expertise: ['UI/UX Design', 'Figma', 'Adobe XD', 'React', 'CSS', 'HTML'],
        qualifications: ['Bachelor of Fine Arts', 'Google UX Design Certificate', 'Adobe Certified Expert'],
        yearsOfExperience: 6,
        socialLinks: {
          website: 'https://tranthibinh.design',
          linkedin: 'https://linkedin.com/in/tranthibinh',
          twitter: 'https://twitter.com/tranthibinh'
        }
      },
      {
        name: 'Lê Văn Cường',
        email: 'levancuong@gmail.com',
        password: await bcrypt.hash('123456', 12),
        role: 'instructor',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bio: 'Data Scientist và Machine Learning Engineer. Chuyên gia về Python và AI.'
      },
      {
        name: 'Phạm Thị Dung',
        email: 'phamthidung@gmail.com',
        password: await bcrypt.hash('123456', 12),
        role: 'instructor',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        bio: 'Digital Marketing Expert với 6+ năm kinh nghiệm trong lĩnh vực marketing online.'
      },
      {
        name: 'Hoàng Văn Em',
        email: 'hoangvanem@gmail.com',
        password: hashedPassword,
        role: 'instructor',
        isEmailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'DevOps Engineer và Cloud Architect. Chuyên gia về AWS, Docker và Kubernetes.'
      }
    ];

    // Add some students
    for (let i = 1; i <= 20; i++) {
      users.push({
        name: `Học viên ${i}`,
        email: `student${i}@gmail.com`,
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + i}?w=150`
      });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    const categories = [
      {
        name: 'Lập trình Web',
        description: 'Học lập trình web từ cơ bản đến nâng cao với các công nghệ hiện đại',
        icon: 'Code',
        color: '#3B82F6',
        order: 1
      },
      {
        name: 'Mobile Development',
        description: 'Phát triển ứng dụng di động cho iOS và Android',
        icon: 'Smartphone',
        color: '#10B981',
        order: 2
      },
      {
        name: 'Data Science & AI',
        description: 'Khoa học dữ liệu, machine learning và trí tuệ nhân tạo',
        icon: 'Brain',
        color: '#8B5CF6',
        order: 3
      },
      {
        name: 'UI/UX Design',
        description: 'Thiết kế giao diện và trải nghiệm người dùng',
        icon: 'Palette',
        color: '#F59E0B',
        order: 4
      },
      {
        name: 'Digital Marketing',
        description: 'Marketing số, SEO, SEM và social media marketing',
        icon: 'TrendingUp',
        color: '#EF4444',
        order: 5
      },
      {
        name: 'DevOps & Cloud',
        description: 'DevOps, cloud computing và infrastructure',
        icon: 'Cloud',
        color: '#06B6D4',
        order: 6
      },
      {
        name: 'Cybersecurity',
        description: 'Bảo mật thông tin và an ninh mạng',
        icon: 'Shield',
        color: '#DC2626',
        order: 7
      },
      {
        name: 'Business & Management',
        description: 'Quản lý kinh doanh và kỹ năng lãnh đạo',
        icon: 'Briefcase',
        color: '#7C3AED',
        order: 8
      }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }
    console.log(`✅ Created ${createdCategories.length} categories`);
    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

// Seed courses
const seedCourses = async (users: any[], categories: any[]) => {
  try {
    const instructors = users.filter(user => user.role === 'instructor');

    const coursesData = [
      // Web Development Courses
      {
        title: 'React.js từ cơ bản đến nâng cao',
        description: 'Khóa học React.js toàn diện từ những kiến thức cơ bản đến các kỹ thuật nâng cao. Học cách xây dựng ứng dụng web hiện đại với React, Redux, và các công cụ ecosystem.',
        shortDescription: 'Học React.js từ cơ bản đến nâng cao với dự án thực tế',
        instructor: instructors[0]._id,
        price: 1299000,
        originalPrice: 1999000,
        duration: 2400, // 40 hours
        level: 'intermediate',
        category: categories.find(c => c.name === 'Lập trình Web')._id,
        tags: ['React', 'JavaScript', 'Frontend', 'Redux', 'Hooks'],
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        previewVideo: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        requirements: [
          'Kiến thức cơ bản về HTML, CSS',
          'Hiểu biết về JavaScript ES6+',
          'Máy tính có kết nối internet'
        ],
        whatYouWillLearn: [
          'Xây dựng ứng dụng React từ đầu',
          'Quản lý state với Redux và Context API',
          'Sử dụng React Hooks hiệu quả',
          'Tối ưu hóa performance React app',
          'Testing với Jest và React Testing Library'
        ],
        lessons: [
          {
            title: 'Giới thiệu về React và JSX',
            description: 'Tìm hiểu về React, JSX và cách setup môi trường phát triển',
            duration: 45,
            order: 1,
            isPreview: true
          },
          {
            title: 'Components và Props',
            description: 'Học cách tạo và sử dụng components, truyền props',
            duration: 60,
            order: 2,
            isPreview: true
          },
          {
            title: 'State và Event Handling',
            description: 'Quản lý state và xử lý events trong React',
            duration: 75,
            order: 3,
            isPreview: false
          }
        ],
        isPublished: true,
        status: 'published',
        featured: true,
        enrolledStudents: 1250,
        rating: 4.8,
        totalRatings: 324
      },
      {
        title: 'Node.js và Express.js Backend Development',
        description: 'Khóa học backend development với Node.js và Express.js. Học cách xây dựng RESTful API, làm việc với database, authentication và deployment.',
        shortDescription: 'Xây dựng backend mạnh mẽ với Node.js và Express',
        instructor: instructors[0]._id,
        price: 1499000,
        originalPrice: 2299000,
        duration: 2800, // 46.7 hours
        level: 'intermediate',
        category: categories.find(c => c.name === 'Lập trình Web')._id,
        tags: ['Node.js', 'Express', 'MongoDB', 'API', 'Backend'],
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
        requirements: [
          'Kiến thức JavaScript cơ bản',
          'Hiểu về HTTP và REST API',
          'Máy tính có Node.js installed'
        ],
        whatYouWillLearn: [
          'Xây dựng RESTful API với Express',
          'Làm việc với MongoDB và Mongoose',
          'Authentication và Authorization',
          'File upload và image processing',
          'Deployment lên cloud platforms'
        ],
        lessons: [
          {
            title: 'Setup Node.js và Express',
            description: 'Cài đặt và cấu hình môi trường Node.js',
            duration: 30,
            order: 1,
            isPreview: true
          },
          {
            title: 'Routing và Middleware',
            description: 'Tạo routes và sử dụng middleware trong Express',
            duration: 45,
            order: 2,
            isPreview: false
          }
        ],
        isPublished: true,
        status: 'published',
        featured: true,
        enrolledStudents: 890,
        rating: 4.7,
        totalRatings: 203
      }
    ];

    // Add more courses for other categories...
    const moreCoursesData = [
      // UI/UX Design
      {
        title: 'UI/UX Design với Figma từ A-Z',
        description: 'Khóa học thiết kế UI/UX toàn diện với Figma. Từ wireframe đến prototype, học cách tạo ra những thiết kế đẹp và user-friendly.',
        shortDescription: 'Thiết kế UI/UX chuyên nghiệp với Figma',
        instructor: instructors[1]._id,
        price: 999000,
        originalPrice: 1599000,
        duration: 1800,
        level: 'beginner',
        category: categories.find(c => c.name === 'UI/UX Design')._id,
        tags: ['Figma', 'UI Design', 'UX Design', 'Prototype', 'Wireframe'],
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
        requirements: [
          'Không cần kinh nghiệm trước đó',
          'Máy tính có kết nối internet',
          'Tài khoản Figma (miễn phí)'
        ],
        whatYouWillLearn: [
          'Nguyên lý thiết kế UI/UX cơ bản',
          'Sử dụng Figma thành thạo',
          'Tạo wireframe và prototype',
          'Design system và component library',
          'User research và testing'
        ],
        lessons: [
          {
            title: 'Giới thiệu về UI/UX Design',
            description: 'Tổng quan về thiết kế giao diện và trải nghiệm người dùng',
            duration: 40,
            order: 1,
            isPreview: true
          }
        ],
        isPublished: true,
        status: 'published',
        featured: false,
        enrolledStudents: 567,
        rating: 4.6,
        totalRatings: 128
      },
      // Data Science & AI
      {
        title: 'Python cho Data Science và Machine Learning',
        description: 'Khóa học Python toàn diện cho Data Science. Học pandas, numpy, matplotlib, scikit-learn và xây dựng các mô hình machine learning thực tế.',
        shortDescription: 'Làm chủ Python cho Data Science và ML',
        instructor: instructors[2]._id,
        price: 1799000,
        originalPrice: 2799000,
        duration: 3600,
        level: 'intermediate',
        category: categories.find(c => c.name === 'Data Science & AI')._id,
        tags: ['Python', 'Data Science', 'Machine Learning', 'Pandas', 'Scikit-learn'],
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        requirements: [
          'Kiến thức Python cơ bản',
          'Toán học cấp 3 (đại số, thống kê)',
          'Máy tính có Python installed'
        ],
        whatYouWillLearn: [
          'Xử lý và phân tích dữ liệu với Pandas',
          'Visualization với Matplotlib và Seaborn',
          'Machine Learning với Scikit-learn',
          'Deep Learning cơ bản với TensorFlow',
          'Triển khai model lên production'
        ],
        lessons: [
          {
            title: 'Python cho Data Science Overview',
            description: 'Tổng quan về Python trong Data Science',
            duration: 45,
            order: 1,
            isPreview: true
          }
        ],
        isPublished: true,
        status: 'published',
        featured: true,
        enrolledStudents: 743,
        rating: 4.9,
        totalRatings: 187
      },
      // Digital Marketing
      {
        title: 'Digital Marketing từ Zero đến Hero',
        description: 'Khóa học Digital Marketing toàn diện. Học SEO, SEM, Social Media Marketing, Content Marketing và Analytics để trở thành chuyên gia marketing số.',
        shortDescription: 'Trở thành chuyên gia Digital Marketing',
        instructor: instructors[3]._id,
        price: 1199000,
        originalPrice: 1899000,
        duration: 2200,
        level: 'beginner',
        category: categories.find(c => c.name === 'Digital Marketing')._id,
        tags: ['SEO', 'SEM', 'Social Media', 'Content Marketing', 'Analytics'],
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        requirements: [
          'Không cần kinh nghiệm trước đó',
          'Hiểu biết cơ bản về internet',
          'Máy tính có kết nối internet'
        ],
        whatYouWillLearn: [
          'Chiến lược Digital Marketing hiệu quả',
          'SEO và SEM optimization',
          'Social Media Marketing',
          'Content Marketing và Copywriting',
          'Google Analytics và tracking'
        ],
        lessons: [
          {
            title: 'Digital Marketing Foundation',
            description: 'Nền tảng cơ bản về Digital Marketing',
            duration: 50,
            order: 1,
            isPreview: true
          }
        ],
        isPublished: true,
        status: 'published',
        featured: false,
        enrolledStudents: 892,
        rating: 4.5,
        totalRatings: 234
      }
    ];

    const allCourses = [...coursesData, ...moreCoursesData];
    const createdCourses = [];
    for (const courseData of allCourses) {
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
    }
    console.log(`✅ Created ${createdCourses.length} courses`);
    return createdCourses;
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    const categories = await seedCategories();
    const courses = await seedCourses(users, categories);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📂 Categories: ${categories.length}`);
    console.log(`📚 Courses: ${courses.length}`);

    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@coursemanagement.com / 123456');
    console.log('Instructor: nguyenvanan@gmail.com / 123456');
    console.log('Student: student1@gmail.com / 123456');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
