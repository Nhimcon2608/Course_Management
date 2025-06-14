import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../models/Coupon';
import User from '../models/User';
import Course from '../models/Course';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';

const couponData = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 100000,
    maxDiscount: 50000,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    usageLimit: 100,
    isActive: true,
    applicableCourses: []
  },
  {
    code: 'SAVE50K',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 200000,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    usageLimit: 50,
    isActive: true,
    applicableCourses: []
  },
  {
    code: 'STUDENT20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 150000,
    maxDiscount: 100000,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    usageLimit: 200,
    isActive: true,
    applicableCourses: []
  },
  {
    code: 'FLASH25',
    discountType: 'percentage',
    discountValue: 25,
    minOrderAmount: 300000,
    maxDiscount: 150000,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    usageLimit: 30,
    isActive: true,
    applicableCourses: []
  },
  {
    code: 'NEWYEAR2024',
    discountType: 'percentage',
    discountValue: 30,
    minOrderAmount: 500000,
    maxDiscount: 200000,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    usageLimit: 75,
    isActive: true,
    applicableCourses: []
  }
];

async function seedCoupons() {
  try {
    console.log('🔄 Starting coupon seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please seed users first.');
    }

    // Clear existing coupons
    await Coupon.deleteMany({});
    console.log('🧹 Cleared existing coupons');

    // Get some courses for specific coupon targeting
    const courses = await Course.find().limit(3);
    
    // Create coupons
    const couponsToCreate = couponData.map((coupon, index) => ({
      ...coupon,
      createdBy: adminUser._id,
      // Add specific courses to some coupons
      applicableCourses: index < 2 && courses.length > index ? [courses[index]._id] : []
    }));

    const createdCoupons = await Coupon.insertMany(couponsToCreate);
    
    console.log(`✅ Created ${createdCoupons.length} coupons:`);
    createdCoupons.forEach(coupon => {
      console.log(`  - ${coupon.code}: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString('vi-VN') + ' VND'} discount`);
    });

    console.log('\n🎉 Coupon seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Coupon seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCoupons()
    .then(() => {
      console.log('✅ Coupon seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Coupon seeding script failed:', error);
      process.exit(1);
    });
}

export default seedCoupons;
