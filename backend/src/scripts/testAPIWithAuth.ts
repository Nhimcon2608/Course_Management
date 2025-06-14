import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import User from '../models/User';

async function testAPIWithAuth() {
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

    console.log(`🔍 Testing API with authentication for user: ${testUser.email}`);

    // Generate JWT token
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

    console.log('🔑 Generated JWT token');

    // Create axios instance with auth
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Test 1: Dashboard stats
    console.log('\n📊 Testing Dashboard Stats API:');
    try {
      const statsResponse = await api.get('/dashboard/stats');
      console.log('✅ Dashboard stats API successful');
      console.log('📈 Stats:', JSON.stringify(statsResponse.data.data.stats, null, 2));
    } catch (error: any) {
      console.log('❌ Dashboard stats API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Dashboard enrolled courses
    console.log('\n📚 Testing Dashboard Enrolled Courses API:');
    try {
      const coursesResponse = await api.get('/dashboard/enrolled-courses?limit=6');
      console.log('✅ Dashboard enrolled courses API successful');
      console.log(`📖 Found ${coursesResponse.data.data.courses.length} enrolled courses:`);
      coursesResponse.data.data.courses.forEach((course: any, index: number) => {
        console.log(`  ${index + 1}. ${course.title} (${course.progress.progressPercentage}% complete)`);
      });
    } catch (error: any) {
      console.log('❌ Dashboard enrolled courses API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Learning courses
    console.log('\n🎓 Testing Learning Courses API:');
    try {
      const learningResponse = await api.get('/learning/courses?limit=12');
      console.log('✅ Learning courses API successful');
      console.log(`📖 Found ${learningResponse.data.data.courses.length} learning courses:`);
      learningResponse.data.data.courses.forEach((course: any, index: number) => {
        console.log(`  ${index + 1}. ${course.title} (${course.progress.progressPercentage}% complete)`);
      });
    } catch (error: any) {
      console.log('❌ Learning courses API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Dashboard recent activity
    console.log('\n📅 Testing Dashboard Recent Activity API:');
    try {
      const activityResponse = await api.get('/dashboard/recent-activity?limit=5');
      console.log('✅ Dashboard recent activity API successful');
      console.log(`📋 Found ${activityResponse.data.data.activities.length} recent activities`);
    } catch (error: any) {
      console.log('❌ Dashboard recent activity API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 5: Dashboard recommendations
    console.log('\n💡 Testing Dashboard Recommendations API:');
    try {
      const recommendationsResponse = await api.get('/dashboard/recommendations?limit=6');
      console.log('✅ Dashboard recommendations API successful');
      console.log(`💡 Found ${recommendationsResponse.data.data.courses.length} recommendations`);
    } catch (error: any) {
      console.log('❌ Dashboard recommendations API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 6: Learning statistics
    console.log('\n📊 Testing Learning Statistics API:');
    try {
      const learningStatsResponse = await api.get('/learning/statistics');
      console.log('✅ Learning statistics API successful');
      console.log('📊 Learning stats:', JSON.stringify(learningStatsResponse.data.data.stats, null, 2));
    } catch (error: any) {
      console.log('❌ Learning statistics API failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎯 API Testing Complete!');
    console.log('\n📝 To test manually in browser:');
    console.log('1. Login to http://localhost:3001/auth/login');
    console.log('2. Use email: nguyenvanan@gmail.com');
    console.log('3. Use password: 123456');
    console.log('4. Navigate to http://localhost:3001/dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAPIWithAuth();
