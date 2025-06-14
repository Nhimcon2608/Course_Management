const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  console.log('🔄 Testing MongoDB connection...');
  console.log('📍 URI format check:', uri ? 'URI found' : 'URI missing');
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  // Hide password in log
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  console.log('📍 Connection URI:', safeUri);
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    console.log('🔌 Attempting to connect...');
    await client.connect();
    
    console.log('✅ MongoDB connection successful!');
    
    // Test database access
    const db = client.db('quan-ly-khoa-hoc');
    const collections = await db.listCollections().toArray();
    
    console.log('📁 Database:', db.databaseName);
    console.log('📁 Collections found:', collections.length);
    
    // Test ping
    await db.admin().ping();
    console.log('🏓 Ping successful!');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS Resolution Error - Possible causes:');
      console.log('1. Incorrect cluster URL');
      console.log('2. Internet connection issues');
      console.log('3. Firewall blocking MongoDB Atlas');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Error - Possible causes:');
      console.log('1. Wrong username or password');
      console.log('2. User doesn\'t have database permissions');
    } else if (error.message.includes('IP')) {
      console.log('\n💡 Network Access Error - Possible causes:');
      console.log('1. IP not whitelisted in MongoDB Atlas');
      console.log('2. Add 0.0.0.0/0 to allow all IPs (for testing)');
    }
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

testConnection();
