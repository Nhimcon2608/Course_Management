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

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: '123456',
  role: 'admin',
  isEmailVerified: true,
  isActive: true,
  bio: 'System Administrator',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  phone: '+84901234567',
  address: 'Ho Chi Minh City, Vietnam'
};

async function createAdminUser() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👨‍💼 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.email);
      console.log('🔑 Login credentials:');
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: ${adminUser.password}`);
      return;
    }

    // Hash password and create admin
    const hashedPassword = await bcrypt.hash(adminUser.password, 12);
    const adminWithHashedPassword = {
      ...adminUser,
      password: hashedPassword
    };

    const createdAdmin = await User.create(adminWithHashedPassword);
    console.log(`✅ Created admin user: ${createdAdmin.name} (${createdAdmin.email})`);

    console.log('\n🔑 Admin login credentials:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log(`Role: ${adminUser.role}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createAdminUser();
