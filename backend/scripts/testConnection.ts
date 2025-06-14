import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database name:', mongoose.connection.db?.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');

    if (mongoose.connection.db) {
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📁 Collections found:', collections.length);
      collections.forEach(col => console.log(`   - ${col.name}`));

      // Test write operation
      const testCollection = mongoose.connection.db.collection('connection_test');
      const testDoc = {
        message: 'Connection test successful',
        timestamp: new Date(),
        from: 'Course Management System'
      };

      const insertResult = await testCollection.insertOne(testDoc);
      console.log('✍️  Test write successful, ID:', insertResult.insertedId);

      // Test read operation
      const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
      console.log('📖 Test read successful:', readResult?.message);

      // Clean up test document
      await testCollection.deleteOne({ _id: insertResult.insertedId });
      console.log('🧹 Test cleanup successful');

      console.log('\n🎉 All database tests passed!');
    } else {
      console.log('⚠️  Database connection established but db object is undefined');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check your username and password in the connection string');
        console.log('2. Make sure the user has proper permissions');
        console.log('3. Verify the database name is correct');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check your internet connection');
        console.log('2. Verify the cluster URL is correct');
        console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
      }
    }
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
}

// Run the test
testConnection();
