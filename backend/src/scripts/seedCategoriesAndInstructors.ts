import mongoose from 'mongoose';
import Category from '@/models/Category';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/config/database';

const seedCategories = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Learn modern web development technologies',
    icon: '🌐',
    color: '#3B82F6',
    isActive: true,
    featured: true,
    order: 1
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Build mobile applications for iOS and Android',
    icon: '📱',
    color: '#10B981',
    isActive: true,
    featured: true,
    order: 2
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Master data analysis and machine learning',
    icon: '📊',
    color: '#8B5CF6',
    isActive: true,
    featured: true,
    order: 3
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'UI/UX design and graphic design courses',
    icon: '🎨',
    color: '#F59E0B',
    isActive: true,
    featured: false,
    order: 4
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business skills and entrepreneurship',
    icon: '💼',
    color: '#EF4444',
    isActive: true,
    featured: false,
    order: 5
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Digital marketing and social media',
    icon: '📈',
    color: '#06B6D4',
    isActive: true,
    featured: false,
    order: 6
  }
];

const seedInstructors = [
  {
    name: 'Nguyễn Văn An',
    email: 'instructor1@example.com',
    password: '123456',
    role: 'instructor',
    isEmailVerified: true,
    isActive: true,
    bio: 'Experienced web developer with 10+ years in the industry',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    phone: '+84901234567',
    address: 'Ho Chi Minh City, Vietnam'
  },
  {
    name: 'Trần Thị Bình',
    email: 'instructor2@example.com',
    password: '123456',
    role: 'instructor',
    isEmailVerified: true,
    isActive: true,
    bio: 'Mobile app developer specializing in React Native and Flutter',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    phone: '+84901234568',
    address: 'Hanoi, Vietnam'
  },
  {
    name: 'Lê Minh Cường',
    email: 'instructor3@example.com',
    password: '123456',
    role: 'instructor',
    isEmailVerified: true,
    isActive: true,
    bio: 'Data scientist and machine learning expert',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    phone: '+84901234569',
    address: 'Da Nang, Vietnam'
  },
  {
    name: 'Phạm Thị Dung',
    email: 'instructor4@example.com',
    password: '123456',
    role: 'instructor',
    isEmailVerified: true,
    isActive: true,
    bio: 'UI/UX designer with expertise in modern design principles',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    phone: '+84901234570',
    address: 'Ho Chi Minh City, Vietnam'
  },
  {
    name: 'Hoàng Văn Em',
    email: 'instructor5@example.com',
    password: '123456',
    role: 'instructor',
    isEmailVerified: true,
    isActive: true,
    bio: 'Business consultant and entrepreneur',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    phone: '+84901234571',
    address: 'Hanoi, Vietnam'
  }
];

async function seedCategoriesAndInstructors() {
  try {
    console.log('🌱 Starting to seed categories and instructors...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🗑️ Clearing existing categories and instructors...');
    await Category.deleteMany({});
    await User.deleteMany({ role: 'instructor' });

    // Seed categories
    console.log('📂 Seeding categories...');
    const createdCategories = await Category.insertMany(seedCategories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Seed instructors
    console.log('👨‍🏫 Seeding instructors...');
    const instructorsWithHashedPasswords = await Promise.all(
      seedInstructors.map(async (instructor) => ({
        ...instructor,
        password: await bcrypt.hash(instructor.password, 12)
      }))
    );

    const createdInstructors = await User.insertMany(instructorsWithHashedPasswords);
    console.log(`✅ Created ${createdInstructors.length} instructors`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\nCreated Categories:');
    createdCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
    });

    console.log('\nCreated Instructors:');
    createdInstructors.forEach((instructor, index) => {
      console.log(`${index + 1}. ${instructor.name} (${instructor.email})`);
    });

    console.log('\n📝 You can now use these accounts to test:');
    console.log('Email: instructor1@example.com | Password: 123456');
    console.log('Email: instructor2@example.com | Password: 123456');
    console.log('Email: instructor3@example.com | Password: 123456');
    console.log('Email: instructor4@example.com | Password: 123456');
    console.log('Email: instructor5@example.com | Password: 123456');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedCategoriesAndInstructors();
}

export default seedCategoriesAndInstructors;
