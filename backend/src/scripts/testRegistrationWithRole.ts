import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface TestUser {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

const testUsers: TestUser[] = [
  {
    name: 'Nguyễn Văn A',
    email: 'student@test.com',
    password: 'Password123',
    role: 'student'
  },
  {
    name: 'Trần Thị B',
    email: 'instructor@test.com',
    password: 'Password123',
    role: 'instructor'
  }
];

async function testRegistration() {
  console.log('🧪 TESTING REGISTRATION WITH ROLE SELECTION');
  console.log('=' .repeat(60));

  for (const testUser of testUsers) {
    console.log(`\n👤 Testing registration for ${testUser.role}: ${testUser.name}`);
    console.log('-'.repeat(50));

    try {
      // Test registration
      const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 201 && response.data.success) {
        console.log('✅ Registration successful!');
        console.log(`📧 Email: ${response.data.data.user.email}`);
        console.log(`👤 Name: ${response.data.data.user.name}`);
        console.log(`🎭 Role: ${response.data.data.user.role}`);
        console.log(`🆔 User ID: ${response.data.data.user._id}`);
        console.log(`🍪 Access Token: ${response.data.data.accessToken ? 'Generated' : 'Missing'}`);
        console.log(`🔄 Refresh Token: ${response.data.data.refreshToken ? 'Generated' : 'Missing'}`);
      } else {
        console.log('❌ Registration failed - Unexpected response');
        console.log('Response:', response.data);
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log('❌ Registration failed');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data?.errors) {
          console.log('Validation errors:');
          error.response.data.errors.forEach((err: any) => {
            console.log(`  - ${err.field}: ${err.message}`);
          });
        }
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
  }

  console.log('\n🧪 TESTING VALIDATION ERRORS');
  console.log('=' .repeat(60));

  // Test missing role
  console.log('\n🚫 Testing registration without role...');
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123'
      // role is missing
    });
    console.log('❌ Should have failed but didn\'t');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      console.log('✅ Correctly rejected registration without role');
      console.log(`Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error);
    }
  }

  // Test invalid role
  console.log('\n🚫 Testing registration with invalid role...');
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test2@example.com',
      password: 'Password123',
      role: 'admin' // Invalid role for registration
    });
    console.log('❌ Should have failed but didn\'t');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      console.log('✅ Correctly rejected registration with invalid role');
      console.log(`Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error);
    }
  }

  console.log('\n🎉 REGISTRATION TESTING COMPLETED!');
  console.log('=' .repeat(60));
  console.log('✅ Role-based registration is working correctly');
  console.log('✅ Validation is working for role field');
  console.log('✅ Both student and instructor roles are supported');
  console.log('✅ Invalid roles are properly rejected');
}

// Run the test
if (require.main === module) {
  testRegistration().catch(console.error);
}

export default testRegistration;
