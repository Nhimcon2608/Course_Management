import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/config/database';

// Load environment variables
dotenv.config();
import User from '@/models/User';
import Category from '@/models/Category';
import Course from '@/models/Course';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Progress from '@/models/Progress';
import Review from '@/models/Review';

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@coursemanagement.com',
    password: 'admin123',
    role: 'admin',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    password: 'user123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Trần Thị Bình',
    email: 'tranthibinh@gmail.com',
    password: 'user123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Lê Minh Cường',
    email: 'leminhcuong@gmail.com',
    password: 'user123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Phạm Thị Dung',
    email: 'phamthidung@gmail.com',
    password: 'user123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Hoàng Văn Em',
    email: 'hoangvanem@gmail.com',
    password: 'instructor123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Vũ Thị Phương',
    email: 'vuthiphuong@gmail.com',
    password: 'instructor123',
    role: 'user',
    isEmailVerified: true,
    isActive: true
  }
];

const sampleCategories = [
  {
    name: 'Lập trình',
    description: 'Các khóa học về lập trình và phát triển phần mềm',
    icon: '💻',
    color: '#3B82F6',
    featured: true,
    order: 1
  },
  {
    name: 'Frontend Development',
    description: 'Phát triển giao diện người dùng',
    icon: '🎨',
    color: '#10B981',
    parentCategory: null, // Will be set to Programming category ID
    order: 1
  },
  {
    name: 'Backend Development',
    description: 'Phát triển server và API',
    icon: '⚙️',
    color: '#F59E0B',
    parentCategory: null, // Will be set to Programming category ID
    order: 2
  },
  {
    name: 'Thiết kế',
    description: 'Thiết kế đồ họa và UI/UX',
    icon: '🎨',
    color: '#EF4444',
    featured: true,
    order: 2
  },
  {
    name: 'UI/UX Design',
    description: 'Thiết kế giao diện và trải nghiệm người dùng',
    icon: '📱',
    color: '#8B5CF6',
    parentCategory: null, // Will be set to Design category ID
    order: 1
  },
  {
    name: 'Kinh doanh',
    description: 'Kỹ năng kinh doanh và quản lý',
    icon: '💼',
    color: '#059669',
    featured: true,
    order: 3
  },
  {
    name: 'Marketing',
    description: 'Marketing và quảng cáo',
    icon: '📈',
    color: '#DC2626',
    parentCategory: null, // Will be set to Business category ID
    order: 1
  },
  {
    name: 'Ngoại ngữ',
    description: 'Học ngoại ngữ',
    icon: '🌍',
    color: '#7C3AED',
    featured: false,
    order: 4
  },
  {
    name: 'Công nghệ',
    description: 'Công nghệ và khoa học máy tính',
    icon: '🔬',
    color: '#0891B2',
    featured: false,
    order: 5
  },
  {
    name: 'Nhiếp ảnh',
    description: 'Kỹ thuật chụp ảnh và chỉnh sửa',
    icon: '📸',
    color: '#BE185D',
    featured: false,
    order: 6
  }
];

// Extended sample courses data
const generateSampleCourses = () => [
  {
    title: 'React.js từ cơ bản đến nâng cao',
    description: 'Khóa học React.js toàn diện từ cơ bản đến nâng cao. Học cách xây dựng ứng dụng web hiện đại với React, Redux, và các công cụ phát triển mới nhất. Khóa học bao gồm các dự án thực tế và best practices trong ngành.',
    shortDescription: 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế',
    price: 1500000,
    originalPrice: 2000000,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500',
    level: 'intermediate',
    duration: 40,
    categoryType: 'frontend'
  },
  {
    title: 'Node.js và Express.js Backend Development',
    description: 'Khóa học phát triển backend với Node.js và Express.js. Học cách xây dựng RESTful API, kết nối database, authentication, và deploy ứng dụng lên production.',
    shortDescription: 'Phát triển backend chuyên nghiệp với Node.js và Express',
    price: 1800000,
    originalPrice: 2500000,
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500',
    level: 'intermediate',
    duration: 35,
    categoryType: 'backend'
  },
  {
    title: 'UI/UX Design với Figma',
    description: 'Khóa học thiết kế UI/UX chuyên nghiệp với Figma. Học cách nghiên cứu người dùng, tạo wireframe, prototype, và design system hoàn chỉnh.',
    shortDescription: 'Thiết kế UI/UX chuyên nghiệp từ ý tưởng đến sản phẩm',
    price: 1200000,
    originalPrice: 1600000,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
    level: 'beginner',
    duration: 25,
    categoryType: 'design'
  },
  {
    title: 'Python cho Data Science',
    description: 'Học Python từ cơ bản và ứng dụng vào Data Science. Khóa học bao gồm pandas, numpy, matplotlib, và machine learning cơ bản.',
    shortDescription: 'Python và Data Science cho người mới bắt đầu',
    price: 1600000,
    originalPrice: 2200000,
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
    level: 'beginner',
    duration: 45,
    categoryType: 'programming'
  },
  {
    title: 'Digital Marketing toàn diện',
    description: 'Khóa học marketing số toàn diện từ SEO, SEM, Social Media Marketing đến Email Marketing và Analytics.',
    shortDescription: 'Làm chủ Digital Marketing từ A đến Z',
    price: 1400000,
    originalPrice: 1800000,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
    level: 'intermediate',
    duration: 30,
    categoryType: 'marketing'
  },
  {
    title: 'Vue.js 3 Composition API',
    description: 'Học Vue.js 3 với Composition API, Pinia state management, và TypeScript. Xây dựng ứng dụng SPA hiện đại.',
    shortDescription: 'Vue.js 3 hiện đại với Composition API',
    price: 1300000,
    originalPrice: 1700000,
    thumbnail: 'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=500',
    level: 'intermediate',
    duration: 32,
    categoryType: 'frontend'
  },
  {
    title: 'MongoDB và Database Design',
    description: 'Thiết kế database NoSQL với MongoDB. Học aggregation, indexing, replication, và performance optimization.',
    shortDescription: 'Làm chủ MongoDB từ cơ bản đến nâng cao',
    price: 1100000,
    originalPrice: 1500000,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500',
    level: 'intermediate',
    duration: 28,
    categoryType: 'backend'
  },
  {
    title: 'Adobe Photoshop cho Designer',
    description: 'Khóa học Photoshop toàn diện cho designer. Từ cơ bản đến nâng cao, bao gồm photo manipulation và digital art.',
    shortDescription: 'Photoshop chuyên nghiệp cho Designer',
    price: 900000,
    originalPrice: 1200000,
    thumbnail: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=500',
    level: 'beginner',
    duration: 22,
    categoryType: 'design'
  },
  {
    title: 'English for IT Professionals',
    description: 'Tiếng Anh chuyên ngành IT. Học vocabulary, communication skills, và presentation skills cho lập trình viên.',
    shortDescription: 'Tiếng Anh IT cho lập trình viên',
    price: 800000,
    originalPrice: 1000000,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500',
    level: 'beginner',
    duration: 20,
    categoryType: 'language'
  },
  {
    title: 'DevOps với Docker và Kubernetes',
    description: 'Học DevOps practices với Docker containerization và Kubernetes orchestration. CI/CD pipeline và cloud deployment.',
    shortDescription: 'DevOps hiện đại với Docker và K8s',
    price: 2000000,
    originalPrice: 2800000,
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=500',
    level: 'advanced',
    duration: 50,
    categoryType: 'technology'
  }
].map(course => ({
  ...course,
  requirements: ['Kiến thức cơ bản về máy tính', 'Đam mê học hỏi', 'Máy tính có kết nối internet'],
  whatYouWillLearn: [
    'Nắm vững kiến thức cơ bản và nâng cao',
    'Thực hành với các dự án thực tế',
    'Áp dụng vào công việc ngay lập tức',
    'Nhận certificate hoàn thành khóa học'
  ],
  tags: ['programming', 'web development', 'technology'],
  language: 'English',
  certificate: true,
  featured: Math.random() > 0.7,
  isPublished: true,
  status: 'published',
  lessons: [
    {
      title: 'Giới thiệu khóa học',
      description: 'Tổng quan về nội dung và mục tiêu khóa học',
      duration: 30,
      order: 1,
      isPreview: true
    },
    {
      title: 'Cài đặt môi trường',
      description: 'Hướng dẫn cài đặt các công cụ cần thiết',
      duration: 45,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài tập thực hành đầu tiên',
      description: 'Thực hành với ví dụ đơn giản',
      duration: 60,
      order: 3,
      isPreview: false
    }
  ]
}));

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Progress.deleteMany({}),
      Review.deleteMany({})
    ]);
    
    // Create users
    console.log('👥 Creating users...');
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = [];
    for (const categoryData of sampleCategories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }
    
    // Update subcategories with parent references
    const programmingCategory = createdCategories.find(cat => cat.name === 'Lập trình');
    const designCategory = createdCategories.find(cat => cat.name === 'Thiết kế');
    const businessCategory = createdCategories.find(cat => cat.name === 'Kinh doanh');
    
    if (programmingCategory) {
      await Category.updateMany(
        { name: { $in: ['Frontend Development', 'Backend Development'] } },
        { parentCategory: programmingCategory._id }
      );
    }
    
    if (designCategory) {
      await Category.updateOne(
        { name: 'UI/UX Design' },
        { parentCategory: designCategory._id }
      );
    }
    
    if (businessCategory) {
      await Category.updateOne(
        { name: 'Marketing' },
        { parentCategory: businessCategory._id }
      );
    }
    
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    // Create courses
    console.log('📚 Creating courses...');
    const sampleCourses = generateSampleCourses();
    const frontendCategory = await Category.findOne({ name: 'Frontend Development' });
    const backendCategory = await Category.findOne({ name: 'Backend Development' });
    const uiuxCategory = await Category.findOne({ name: 'UI/UX Design' });
    const programmingCat = await Category.findOne({ name: 'Lập trình' });
    const designCat = await Category.findOne({ name: 'Thiết kế' });
    const businessCat = await Category.findOne({ name: 'Kinh doanh' });
    const languageCat = await Category.findOne({ name: 'Ngoại ngữ' });
    const technologyCat = await Category.findOne({ name: 'Công nghệ' });

    const instructors = createdUsers.filter(user => user.email.includes('instructor') || user.role === 'admin');

    const coursesWithRefs = sampleCourses.map((course: any, index: number) => {
      let categoryId;
      switch (course.categoryType) {
        case 'frontend':
          categoryId = frontendCategory?._id;
          break;
        case 'backend':
          categoryId = backendCategory?._id;
          break;
        case 'design':
          categoryId = uiuxCategory?._id;
          break;
        case 'programming':
          categoryId = programmingCat?._id;
          break;
        case 'marketing':
          categoryId = businessCat?._id;
          break;
        case 'language':
          categoryId = languageCat?._id;
          break;
        case 'technology':
          categoryId = technologyCat?._id;
          break;
        default:
          categoryId = programmingCat?._id;
      }

      return {
        ...course,
        instructor: instructors[index % instructors.length]._id,
        category: categoryId,
        enrolledStudents: Math.floor(Math.random() * 500) + 50,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
        totalRatings: Math.floor(Math.random() * 100) + 20
      };
    });

    const createdCourses = [];
    for (const courseData of coursesWithRefs) {
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
    }
    console.log(`✅ Created ${createdCourses.length} courses`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`📂 Categories: ${createdCategories.length}`);
    console.log(`📚 Courses: ${createdCourses.length}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@coursemanagement.com / admin123');
    console.log('User: nguyenvanan@gmail.com / user123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
