const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testDatabaseConnection() {
  try {
    console.log('🚀 Course Management System - Database Connection Test');
    console.log('=' .repeat(60));
    
    // Kiểm tra environment variables
    console.log('🔧 Environment Check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'configured' : 'missing');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in .env file');
      console.log('💡 Please check your backend/.env file');
      return;
    }
    
    // Hiển thị connection string (ẩn password)
    const safeUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log('   Connection URI:', safeUri);
    
    console.log('\n🔌 Attempting to connect to MongoDB...');
    
    // Kết nối với MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database info:');
    console.log('   Database name:', mongoose.connection.db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port || 'default');
    console.log('   Ready state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    // Test basic operations
    console.log('\n🧪 Testing database operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    if (collections.length > 0) {
      collections.forEach(col => console.log(`   - ${col.name}`));
    } else {
      console.log('   (No collections found - database is empty)');
    }
    
    // Test write operation
    console.log('\n✍️  Testing write operation...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      message: 'Course Management System connection test',
      timestamp: new Date(),
      nodeVersion: process.version,
      mongooseVersion: mongoose.version
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('   Write test successful, ID:', insertResult.insertedId);
    
    // Test read operation
    console.log('📖 Testing read operation...');
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('   Read test successful:', readResult.message);
    
    // Test update operation
    console.log('🔄 Testing update operation...');
    const updateResult = await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { updated: true, updateTime: new Date() } }
    );
    console.log('   Update test successful, modified:', updateResult.modifiedCount);
    
    // Test delete operation
    console.log('🗑️  Testing delete operation...');
    const deleteResult = await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('   Delete test successful, deleted:', deleteResult.deletedCount);
    
    // Check required collections for Course Management System
    console.log('\n📋 Checking required collections for Course Management System:');
    const requiredCollections = [
      'users', 'courses', 'categories', 'orders', 'cart',
      'wishlist', 'reviews', 'lessons', 'assignments',
      'assignmentsubmissions', 'notifications', 'coupons'
    ];
    
    const existingCollectionNames = collections.map(col => col.name);
    let missingCollections = [];
    
    requiredCollections.forEach(collectionName => {
      const exists = existingCollectionNames.includes(collectionName);
      console.log(`   ${exists ? '✅' : '❌'} ${collectionName}: ${exists ? 'exists' : 'missing'}`);
      if (!exists) {
        missingCollections.push(collectionName);
      }
    });
    
    // Database statistics
    if (existingCollectionNames.length > 0) {
      console.log('\n📊 Database Statistics:');
      for (const collectionName of ['users', 'courses', 'categories', 'orders']) {
        if (existingCollectionNames.includes(collectionName)) {
          try {
            const count = await mongoose.connection.db.collection(collectionName).countDocuments();
            console.log(`   📈 ${collectionName}: ${count} documents`);
          } catch (error) {
            console.log(`   ⚠️  ${collectionName}: error counting documents`);
          }
        }
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (missingCollections.length > 0) {
      console.log('   🌱 Run database seeding to create missing collections:');
      console.log('      npm run seed:all');
    } else {
      console.log('   ✅ All required collections are present');
    }
    
    console.log('\n🎉 All database tests completed successfully!');
    console.log('🚀 Your Course Management System is ready to use the database!');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error:', error.message);
    
    // Provide specific troubleshooting tips
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS Resolution Error - Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the MongoDB Atlas cluster URL is correct');
      console.log('3. Make sure your IP is whitelisted in MongoDB Atlas Network Access');
      console.log('4. Try using a different network (mobile hotspot) to test');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Error - Troubleshooting:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify user has proper database permissions');
      console.log('3. Make sure password doesn\'t contain special characters that need encoding');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection Timeout - Troubleshooting:');
      console.log('1. Check your internet connection stability');
      console.log('2. Try connecting from a different network');
      console.log('3. Verify MongoDB Atlas cluster is running');
    }
    
    console.log('\n📚 For more help, check:');
    console.log('   - MongoDB Atlas documentation');
    console.log('   - Network Access settings in MongoDB Atlas');
    console.log('   - Database Access settings in MongoDB Atlas');
    
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the test
console.log('Starting Course Management System Database Test...\n');
testDatabaseConnection();
