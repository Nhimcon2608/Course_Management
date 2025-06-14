const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  bio: String,
  avatar: String,
  phone: String,
  address: String
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

const instructors = [
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

async function createInstructors() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👨‍🏫 Creating instructor accounts...');
    
    // Remove existing instructors
    await User.deleteMany({ role: 'instructor' });
    console.log('🗑️ Removed existing instructors');

    // Hash passwords and create instructors
    const instructorsWithHashedPasswords = await Promise.all(
      instructors.map(async (instructor) => ({
        ...instructor,
        password: await bcrypt.hash(instructor.password, 12)
      }))
    );

    const createdInstructors = await User.insertMany(instructorsWithHashedPasswords);
    console.log(`✅ Created ${createdInstructors.length} instructors`);

    console.log('\n📝 Instructor accounts created:');
    createdInstructors.forEach((instructor, index) => {
      console.log(`${index + 1}. ${instructor.name} (${instructor.email})`);
    });

    console.log('\n🔑 Login credentials:');
    instructors.forEach((instructor, index) => {
      console.log(`${index + 1}. Email: ${instructor.email} | Password: ${instructor.password}`);
    });

  } catch (error) {
    console.error('❌ Error creating instructors:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createInstructors();
